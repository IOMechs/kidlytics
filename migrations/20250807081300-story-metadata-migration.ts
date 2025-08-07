
import * as admin from 'firebase-admin';
import * as langdetect from 'langdetect';
import { environment } from '../src/environments/environment';

// You need to download your service account key from the Firebase console
// and set the GOOGLE_APPLICATION_CREDENTIALS environment variable.
// Example: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/serviceAccountKey.json"

const BATCH_SIZE = 50;

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

// Keys from the userPrompt object
const LANG_KEY = 'Which language would you like the story to be in';
const WORLD_KEY = 'What kind of world should the story happen in?';
const LESSON_KEY = 'What should the story teach or focus on?';
const MOOD_KEY = 'What mood should the story have?';

/**
 * Removes emoji and leading/trailing whitespace from a string.
 * @param str The string to clean.
 * @returns The cleaned string.
 */
const cleanValue = (str: string | undefined): string | undefined => {
  if (!str) {
    return undefined;
  }
  // This regex removes most emojis and symbols, then trims whitespace.
  return str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
};

/**
 * Detects the language from a given text.
 * @param text The text to analyze.
 * @returns The detected language name in lowercase (e.g., "english") or undefined.
 */
const detectLanguage = (text: string | undefined): string | undefined => {
  if (!text) {
    return undefined;
  }
  try {
    // langdetect returns an array of possible languages with probabilities
    const detections = langdetect.detect(text);
    if (detections && detections.length > 0) {
      // The first one is the most likely
      const langCode = detections[0].lang;
      // We can create a simple map for common languages if needed, or just use the code
      const langMap: { [key: string]: string } = {
        en: 'english',
        sv: 'swedish',
        es: 'spanish',
        fr: 'french',
        de: 'german',
        it: 'italian',
      };
      return langMap[langCode] || langCode;
    }
  } catch (error) {
    console.warn(`Could not detect language for text snippet: "${text.substring(0, 50)}...". Error:`, error);
  }
  // Fallback to the original text, lowercased
  return text.toLowerCase();
};


const migrateStories = async () => {
  console.log('Starting story migration...');
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
      const userPrompt = data.userPrompt;

      // Skip if migration has already been run on this doc
      if (data.language && data.world && data.lesson && data.mood) {
        console.log(`Skipping document ${doc.id} (already migrated).`);
        continue;
      }

      if (!userPrompt) {
        console.warn(`Skipping document ${doc.id} (no userPrompt field).`);
        continue;
      }

      const languageText = userPrompt[LANG_KEY];
      const worldText = userPrompt[WORLD_KEY];
      const lessonText = userPrompt[LESSON_KEY];
      const moodText = userPrompt[MOOD_KEY];

      const updateData: { [key: string]: any } = {};

      const language = detectLanguage(languageText);
      if (language) updateData.language = language;

      const world = cleanValue(worldText);
      if (world) updateData.world = world;

      const lesson = cleanValue(lessonText);
      if (lesson) updateData.lesson = lesson;

      const mood = cleanValue(moodText);
      if (mood) updateData.mood = mood;

      if (Object.keys(updateData).length > 0) {
        console.log(`Updating doc ${doc.id}:`, updateData);
        batch.update(doc.ref, updateData);
        storiesProcessed++;
      } else {
        console.log(`No updates for doc ${doc.id}.`);
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
