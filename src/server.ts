import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { fileURLToPath } from 'url';

// Polyfill for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);

import express, { Request, Response, NextFunction } from 'express';
import { join } from 'node:path';
import {
  imageGenerationFlow,
  storyGenerationFlow,
  blueprintGenerationFlow,
} from './genkit/storyGenerationFlow';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { EdgeTTS, SynthesisResult } from '@duyquangnvx/edge-tts';
import { ERROR_CODES } from './constants/error.codes';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
dotenv.config({ path: '.env.local' });
app.set('trust proxy', 1); // Trust the first proxy
const angularApp = new AngularNodeAppEngine();

const sendError = (
  res: Response,
  errorType: keyof typeof ERROR_CODES,
  underlyingError?: any
) => {
  const error = ERROR_CODES[errorType];
  console.error(
    `Responding with error ${error.code}: ${error.message}`,
    underlyingError || ''
  );

  let httpStatus = 500; // Default to Internal Server Error
  if (error.code === ERROR_CODES.IMAGE_SAFETY_BLOCK.code) httpStatus = 400;
  if (error.code === ERROR_CODES.RATE_LIMIT_EXCEEDED.code) httpStatus = 429;
  if (error.code === ERROR_CODES.BLUEPRINT_GENERATION_FAILED.code)
    httpStatus = 400;

  res.status(httpStatus).json({
    error: {
      code: error.code,
      message: error.message,
    },
  });
};


const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  if (process.env['enableStoryGenerationLimit'] !== 'true') {
    return next();
  }

  try {
    const response = await axios.post(process.env['rateLimiterUrl']!, {
      identifier: req.body.identifier,
      checkOnly: false, // This is a real request, so we increment
    });
    if (response.data.allowed) {
      next();
    } else {
      res
        .status(429)
        .json({ message: response.data.message || 'Rate limit exceeded.' });
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      res.status(429).json({
        message: error.response.data.message || 'Rate limit exceeded.',
      });
    } else {
      console.error('Error calling rate limiter function:', error);
      // Fail open for other errors
      next();
    }
  }
};

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

app.post(
  '/api/generateStory',
  express.json(),
  rateLimiter,
  async (req: Request, res: Response) => {
    try {
      const result = await storyGenerationFlow(req.body);
      res.json(result);
    } catch (err) {
      sendError(res, 'STORY_GENERATION_FAILED', err);
    }
  }
);

app.post(
  '/api/generateBlueprint',
  express.json(),
  async (req: Request, res: Response) => {
    try {
      const result = await blueprintGenerationFlow(req.body);
      res.json(result);
    } catch (err) {
      sendError(res, 'BLUEPRINT_GENERATION_FAILED', err);
    }
  }
);

app.post(
  '/api/imageGen',
  express.json(),
  async (req: Request, res: Response) => {
    const { imagePrompt, seed } = req.body;

    try {
      const { imageUri } = await imageGenerationFlow({
        imagePrompt,
        seed,
      });
      if (!imageUri) {
        return sendError(res, 'IMAGE_URI_MISSING');
      }
      res.json({ imageUri });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.toLowerCase().includes('safety')) {
        return sendError(res, 'IMAGE_SAFETY_BLOCK', error);
      }
      return sendError(res, 'IMAGE_GENERATION_FAILED', error);
    }
  }
);

app.post(
  '/api/rateLimiter',
  express.json(),
  async (req: Request, res: Response) => {
    try {
      const response = await axios.post(process.env['rateLimiterUrl']!, {
        identifier: req.body.identifier,
        checkOnly: true, // This is just a check, so don't increment
      });
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error('Error calling rate limiter function:', error);
      const status = error.response?.status || 500;
      const data = error.response?.data || {
        message: 'Internal server error.',
      };
      res.status(status).json(data);
    }
  }
);

app.post(
  '/api/validatePassword',
  express.json(),
  async (req: Request, res: Response) => {
    try {
      const response = await axios.post(process.env['validatePasswordUrl']!, {
        identifier: req.body.identifier,
        password: req.body.password,
      });
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error('Error calling password validation function:', error);
      const status = error.response?.status || 500;
      const data = error.response?.data || {
        message: 'Internal server error.',
      };
      res.status(status).json(data);
    }
  }
);

app.post(
  '/api/text-to-speech',
  express.json(),
  async (req: Request, res: Response) => {
    try {
      const { content } = req.body;

      if (!Array.isArray(content) || content.length === 0) {
        res
          .status(400)
          .json({ status: 'Error', message: 'Invalid content array' });
        return;
      }

      const tts = new EdgeTTS();
      const voice = 'en-US-EmmaNeural';

      const results = await Promise.all(
        content.map(async (text: string, index: number) => {
          const result: SynthesisResult = await tts.synthesize(text, voice, {
            rate: -10,
            volume: 0,
            pitch: 10,
          });
          const base64Audio = result.toBase64(); // base64 string of mp3
          return {
            index,
            text,
            base64: `data:audio/mp3;base64,${base64Audio}`,
          };
        })
      );

      res.status(200).json({
        status: 'Success',
        data: results,
      });
    } catch (error) {
      console.error('TTS Error:', error);
      res.status(500).json({
        status: 'Error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate voiceover',
      });
    }
  }
);

app.use((req: Request, res: Response, next: NextFunction) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next()
    )
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 8080;
  app.listen(port, (error?: Error) => {
    if (error) {
      throw error;
    }
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
