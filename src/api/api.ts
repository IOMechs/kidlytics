// src/api.ts

import express from 'express';
import cors from 'cors'; // Import cors
import {
  imageGenerationFlow,
  storyGenerationFlow,
} from '../genkit/storyGenerationFlow';

const app = express();

// Use CORS middleware
app.use(cors());
app.use(express.json());

// --- API Endpoints ---
app.post('/api/generateStory', async (req, res) => {
  try {
    const result = await storyGenerationFlow(req.body);
    res.json(result);
  } catch (err) {
    console.error('Flow error:', err);
    res.status(500).json({ error: 'Failed to generate story' });
  }
});

app.post('/api/test', (req, res) => {
  console.log('BODY:', req.body); // should log your POST data
  res.json({ received: req.body });
});

app.post('/api/imageGen', async (req, res) => {
  try {
    const { imageUri } = await imageGenerationFlow(req.body);
    if (!imageUri) throw new Error('Error while generating image');
    res.json({ imageUri });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Image while generating image' });
  }
});

// --- Start the API Server ---
const port = process.env['PORT_API'] || 4001; // Use a different port
app.listen(port, () => {
  console.log(`✅ API server listening on http://localhost:${port}`);
});
