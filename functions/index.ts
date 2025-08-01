import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';
import * as dotenv from 'dotenv';

const { KokoroTTS } = require('kokoro-js');

dotenv.config();
admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true });

import { pipeline } from '@xenova/transformers';
import * as wavefile from 'wavefile';

export const rateLimiter = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (process.env.ENABLE_STORY_GENERATION_LIMIT !== 'true') {
      res
        .status(200)
        .send({ allowed: true, message: 'Rate limiting is disabled.' });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { identifier, checkOnly } = req.body;
    if (!identifier) {
      res.status(400).send({ error: 'Identifier is required.' });
      return;
    }

    const limit = parseInt(process.env.STORY_GENERATION_LIMIT || '3', 10);
    const docRef = db.collection('rate-limits').doc(identifier);

    try {
      const doc = await docRef.get();
      if (doc.exists) {
        const data = doc.data();
        if (data?.unlimited) {
          res.status(200).send({ allowed: true });
          return;
        }
        if (data?.count >= limit) {
          res.status(429).send({ allowed: false, message: 'Limit reached.' });
          return;
        }
      }

      if (checkOnly) {
        res.status(200).send({ allowed: true });
        return;
      }

      // Increment and allow
      await docRef.set(
        { count: admin.firestore.FieldValue.increment(1) },
        { merge: true }
      );
      res.status(200).send({ allowed: true });
    } catch (error) {
      console.error('Error in rateLimiter:', error);
      // Fail open
      res.status(200).send({ allowed: true });
    }
  });
});

export const validatePasswordAndOverride = functions.https.onRequest(
  async (req, res) => {
    corsHandler(req, res, async () => {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const { identifier, password } = req.body;
      if (!identifier || !password) {
        res
          .status(400)
          .send({ error: 'Identifier and password are required.' });
        return;
      }

      if (password === process.env.ADMIN_PASSWORD) {
        const docRef = db.collection('rate-limits').doc(identifier);
        await docRef.set({ unlimited: true }, { merge: true });
        res.status(200).send({ valid: true });
      } else {
        res.status(401).send({ valid: false });
      }
    });
  }
);

export const kokoroTTS = functions.https.onRequest(async (req, res) => {
  try {
    const { content, voice = 'af_bella' } = req.body;

    if (!Array.isArray(content) || content.length === 0) {
      res
        .status(400)
        .json({ error: 'content must be a non-empty array of strings' });
      return;
    }

    const model_id = 'onnx-community/Kokoro-82M-ONNX';
    const ttsModel = await KokoroTTS.from_pretrained(model_id, {
      dtype: 'q8', // or "fp32" for higher quality
    });

    const audioResponses: { index: number; text: string; base64: string }[] =
      [];

    for (let i = 0; i < content.length; i++) {
      const text = content[i];
      const audio = await ttsModel.generate(text, { voice });
      const blob = audio.toBlob();
      const arrayBuffer = await blob.arrayBuffer(); // Convert Blob to ArrayBuffer
      const buffer = Buffer.from(arrayBuffer); // Convert ArrayBuffer to Node Buffer
      const base64 = buffer.toString('base64');
      audioResponses.push({
        index: i,
        text,
        base64: `data:audio/wav;base64,${base64}`,
      });
    }

    res.status(200).json({
      status: 'Success',
      message: 'Audio generated for all content parts',
      data: audioResponses,
    });
  } catch (error) {
    console.error('Kokoro TTS Error:', error);
    res.status(500).json({
      status: 'Error',
      message: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
});

export const mmsTTSEng = functions
  .runWith({ timeoutSeconds: 300, memory: '2GB' })
  .https.onRequest(async (req, res) => {
    try {
      const { content } = req.body;

      if (!Array.isArray(content)) {
        res.status(400).json({ error: 'content must be an array of strings' });
        return;
      }

      // Dynamically load the synthesizer inside the function
      const tts = await pipeline('text-to-speech', 'Xenova/mms-tts-eng', {
        quantized: false,
      });

      const audioBuffers: string[] = [];

      for (const text of content) {
        const result = await tts(text, {});

        const wav = new wavefile.WaveFile();
        wav.fromScratch(1, result.sampling_rate, '32f', result.audio);

        audioBuffers.push(wav.toBase64());
      }

      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        message: 'Audio generated for all content parts',
        audios: audioBuffers,
      });
    } catch (error) {
      console.error('TTS Error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal Server Error',
      });
    }
  });

const speaker_embeddings_url =
  'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/speaker_embeddings.bin';

export const speech5_TTS = functions
  .region('us-central1')
  .runWith({ timeoutSeconds: 300, memory: '2GB' }) // must be 'GiB' not 'GB'
  .https.onRequest(async (req, res) => {
    try {
      const { content } = req.body;

      if (!Array.isArray(content)) {
        res.status(400).json({ error: 'content must be an array of strings' });
        return;
      }

      // Load TTS model
      const tts = await pipeline('text-to-speech', 'Xenova/speecht5_tts');

      // Fetch speaker embeddings once
      const response = await fetch(speaker_embeddings_url);
      const buffer = await response.arrayBuffer();
      const speaker_embeddings = new Float32Array(buffer);

      const audioBuffers: string[] = [];

      for (const text of content) {
        const result = await tts(text, {
          speaker_embeddings,
        });

        const wav = new wavefile.WaveFile();
        wav.fromScratch(1, result.sampling_rate, '32f', result.audio);

        // Convert to base64 for JSON transport
        audioBuffers.push(wav.toBase64());
      }

      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        message: 'Audio generated for all content parts',
        audios: audioBuffers,
      });
    } catch (error) {
      console.error('TTS Error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal Server Error',
      });
    }
  });
