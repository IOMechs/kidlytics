import express from 'express';
import { join } from 'node:path';
import {
  imageGenerationFlow,
  storyGenerationFlow,
} from './genkit/storyGenerationFlow';
import { environment } from './environments/environment';
import cors from 'cors';

const browserDistFolder = join(process.cwd(), 'dist/kidelytics/browser');

const app = express();

app.use(cors());
app.use(express.json());

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
    res.status(500).json({ error: 'Failed to generate story' });
  }
});

app.post('/api/imageGen', async (req, res) => {
  const { imagePrompt } = req.body;
  const CLOUDFLARE_API_TOKEN = environment.CLOUDFLARE_WORKER_AI_TOKEN;
  const model = '@cf/black-forest-labs/flux-1-schnell';
  const url = environment.CLOUDFLARE_URL + model || '';

  const prompt = `${imagePrompt}`;

  try {
    const { imageUri } = await imageGenerationFlow({
      imagePrompt,
    });
    if (!imageUri) throw new Error('Error while generating image');
    res.json({ imageUri });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Image while generating image' }); // or throw error if you want to handle it upstream
  }
});

/**
 * Serve static files from /browser
 */
app.use(express.static(browserDistFolder, {
  maxAge: '1y',
  index: false,
  redirect: false,
}));

/**
 * All other routes should serve the index.html file
 */
app.get('*', (req, res) => {
  res.sendFile(join(browserDistFolder, 'index.html'));
});

/**
 * Start the server.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
const port = process.env['PORT'] || 4200;
app.listen(port, () => {
  console.log(`Node Express server listening on http://localhost:${port}`);
});
