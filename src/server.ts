import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import {
  imageGenerationFlow,
  storyGenerationFlow,
} from './genkit/storyGenerationFlow';
import * as dotenv from 'dotenv';
import path from 'path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
dotenv.config({ path: '.env.local' });
const angularApp = new AngularNodeAppEngine();

app.use(express.json());

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

app.post('/api/test', (req, res) => {
  console.log('BODY:', req.body); // should log your POST data
  res.json({ received: req.body });
});

app.post('/api/generateStory', async (req, res) => {
  try {
    const result = await storyGenerationFlow(req.body);

    res.json(result);
  } catch (err) {
    console.error('Flow error:', err);
    res.status(500).json({ error: `Failed to generate story ${err}` });
  }
});

app.post('/api/imageGen', async (req, res) => {
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
    res.status(500).json({ error: 'Image while generating image' }); // or throw error if you want to handle it upstream
  }
});

// app.post('/api/generateStory', expressHandler(storyGenerationFlow));
/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next()
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 8080;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
