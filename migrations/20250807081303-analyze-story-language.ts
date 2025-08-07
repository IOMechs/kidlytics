import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { environment } from '../src/environments/environment';
import 'dotenv/config'

const BATCH_SIZE = 10;

// Initialize Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: environment.gcpProjectId,
    databaseURL: `https://${environment.gcpProjectId}.firebaseio.com`,
  });
  console.log('Firebase Admin SDK initialized successfully.');
} catch (error: any) {
  console.error('Error initializing Firebase Admin SDK:', error);
  if (error.code === 'GOOGLE_APPLICATION_CREDENTIALS_NOT_SET') {
    console.error('--------------------------------------------------------------------');
    console.error('**ERROR:** The GOOGLE_APPLICATION_CREDENTIALS environment variable is not set.');
    console.error('Please download your service account key from the Firebase Console and set the path.');
    console.error('Example: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/serviceAccountKey.json"');
    console.error('--------------------------------------------------------------------');
  }
  process.exit(1);
}

const db = admin.firestore();
const storiesCollection = db.collection('stories');

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Detects the language from a given text using the Gemini API.
 * @param text The text to analyze.
 * @returns The detected language name in lowercase (e.g., "english") or undefined.
 */
const detectLanguageWithGemini = async (text: string | undefined): Promise<string | undefined> => {
  if (!text) {
    return undefined;
  }

  try {
    const prompt = `Analyze the following text and identify its language. Return only the language name in lowercase (e.g., "english", "spanish"). Text: "${text}"`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const language = response.text();
    return language.trim();
  } catch (error) {
    console.error(`Could not detect language for text snippet: "${text.substring(0, 50)}...". Error:`, error);
    return undefined;
  }
};

const migrateStories = async () => {
  console.log('Starting story language analysis migration...');
  let lastVisible: admin.firestore.QueryDocumentSnapshot | null = null;
  let storiesProcessed = 0;

  while (true) {
    const query = storiesCollection
      .orderBy(admin.firestore.FieldPath.documentId())
      .limit(BATCH_SIZE);

    const snapshot = await (lastVisible ? query.startAfter(lastVisible) : query).get();

    if (snapshot.empty) {
      console.log('No more stories to process.');
      break;
    }

    lastVisible = snapshot.docs[snapshot.docs.length - 1];
    const batch = db.batch();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const storyParts = data.storyParts;

      if (!storyParts || !Array.isArray(storyParts) || storyParts.length === 0) {
        console.warn(`Skipping document ${doc.id} (no story content).`);
        continue;
      }

      // Concatenate story parts to get a good sample of text
      const storyContent = storyParts.map(p => p.content).join(' ');

      const language = await detectLanguageWithGemini(storyContent);

      if (language) {
        console.log(`Updating doc ${doc.id}: setting language to ${language}`);
        batch.update(doc.ref, { language });
        storiesProcessed++;
      } else {
        console.log(`Could not determine language for doc ${doc.id}.`);
      }
    }

    await batch.commit();
    console.log(`Batch committed. ${storiesProcessed} total stories updated so far.`);
  }

  console.log(`Migration complete. Total stories processed and updated: ${storiesProcessed}`);
};

migrateStories().catch(error => {
  console.error('An unexpected error occurred during migration:', error);
  process.exit(1);
});