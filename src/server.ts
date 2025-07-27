import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { Request, Response, NextFunction } from 'express';
import { join } from 'node:path';
import {
  imageGenerationFlow,
  storyGenerationFlow,
} from './genkit/storyGenerationFlow';
import * as dotenv from 'dotenv';
import axios from 'axios';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
dotenv.config({ path: '.env.local' });
app.set('trust proxy', 1); // Trust the first proxy
const angularApp = new AngularNodeAppEngine();

const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (process.env['enableStoryGenerationLimit'] !== 'true') {
    return next();
  }

  try {
    const response = await axios.post(process.env['rateLimiterUrl']!, {
      identifier: req.body.identifier,
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
      console.error('Flow error:', err);
      res.status(500).json({ error: `Failed to generate story ${err}` });
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
      if (!imageUri) throw new Error('Error while generating image');
      res.json({ imageUri });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: `Error while generating image ${error}` });
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
