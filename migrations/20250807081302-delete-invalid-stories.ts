
import * as admin from 'firebase-admin';
import { environment } from '../src/environments/environment';

// List of document IDs to be deleted
const DOC_IDS_TO_DELETE = [
  '1eo8mQbRRhQa5jEF8OXG', '90VRNCw7W1eFAIgF9t4h', 'D96DfXWV3lLfKScIvKs9',
  'DwWxmbTI8GzOJDeAmMvN', 'EWBpu5wwgrqFlE195Cv6', 'G1VQE0EXubSae98BginE',
  'GmOKddmzOpv6Ad2OXzTt', 'IcRH8egyaaPJHnGotL75', 'IjGcHodDa8QnY8VoruVH',
  'LfTMcFjirdCkeACpvqW3', 'MNsizRsASxyRYAIrNAQu', 'OKA1wscwIcqXdTjLwnO9',
  'OdlPHOnjuXosLfSEKTK2', 'TmQSCLxtyj4jXL4ZNPoN', 'UxMfIdl8pgJK2OvxGlhx',
  'clxjPIztBytpxmnYl79j', 'd9xUseG0oQYWW7GF1m2v', 'dFkTravPdrKNu9M1np9i',
  'dcdV6PEEIvyjoNCls9fm', 'it4iLPBgCXvaIqWaWNxf', 'qFMBiq2UYjdklh5qqgNd',
  'r4uLrTbiL4nVWeQfOvPV', 'sEg9OqRtfcY32OlgJImP', 'sYixgeO74bsKrbPwTtsT',
  'u1mlHW474OYBZvfFuqPH', 'zorDI3akQ2akG1VBYs4v'
];

const BATCH_SIZE = 50; // Firestore batch limit is 500, 50 is safe

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
  process.exit(1);
}

const db = admin.firestore();
const storiesCollection = db.collection('stories');

const deleteStories = async () => {
  console.log(`Starting deletion of ${DOC_IDS_TO_DELETE.length} stories...`);
  let deletedCount = 0;

  // Process in batches
  for (let i = 0; i < DOC_IDS_TO_DELETE.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = DOC_IDS_TO_DELETE.slice(i, i + BATCH_SIZE);

    console.log(`Processing batch of ${chunk.length} documents...`);

    for (const docId of chunk) {
      const docRef = storiesCollection.doc(docId);
      batch.delete(docRef);
    }

    try {
      await batch.commit();
      deletedCount += chunk.length;
      console.log(`Batch committed successfully. ${deletedCount} documents deleted so far.`);
    } catch (error) {
      console.error('Error committing batch:', error);
      // Decide if you want to stop or continue on error
    }
  }

  console.log(`Deletion complete. Total documents deleted: ${deletedCount}`);
};

deleteStories().catch(error => {
  console.error('An unexpected error occurred during the deletion process:', error);
  process.exit(1);
});
