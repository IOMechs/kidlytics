import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';

admin.initializeApp();
const db = admin.firestore();
const corsHandler = cors({ origin: true });

export const rateLimiter = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    if (process.env.ENABLE_STORY_GENERATION_LIMIT !== 'true') {
      res.status(200).send({ allowed: true, message: 'Rate limiting is disabled.' });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { ip } = req.body;
    if (!ip) {
      res.status(400).send({ error: 'IP address is required.' });
      return;
    }

    const limit = parseInt(process.env.STORY_GENERATION_LIMIT || '3', 10);
    const docRef = db.collection('ip-rate-limits').doc(ip);

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

      const { ip, password } = req.body;
      if (!ip || !password) {
        res
          .status(400)
          .send({ error: 'IP address and password are required.' });
        return;
      }

      if (password === process.env.ADMIN_PASSWORD) {
        const docRef = db.collection('ip-rate-limits').doc(ip);
        await docRef.set({ unlimited: true }, { merge: true });
        res.status(200).send({ valid: true });
      } else {
        res.status(401).send({ valid: false });
      }
    });
  }
);
