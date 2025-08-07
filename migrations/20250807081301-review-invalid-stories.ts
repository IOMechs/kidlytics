
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { environment } from '../src/environments/environment';

// List of document IDs that were skipped during migration due to missing 'userPrompt'
const SKIPPED_DOC_IDS = [
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

const OUTPUT_FILE = 'invalid-stories-review.txt';

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

const reviewStories = async () => {
  console.log(`Fetching ${SKIPPED_DOC_IDS.length} stories for review...`);
  let fileContent = `Review of ${SKIPPED_DOC_IDS.length} stories that may be invalid.\n\n`;
  fileContent += '============================================================\n\n';

  for (const docId of SKIPPED_DOC_IDS) {
    try {
      const doc = await storiesCollection.doc(docId).get();
      if (!doc.exists) {
        fileContent += `Document ID: ${docId}\nStatus: NOT FOUND\n\n`;
        fileContent += '------------------------------------------------------------\n\n';
        continue;
      }

      const data = doc.data();
      fileContent += `Document ID: ${docId}\n`;
      fileContent += `Created At: ${data?.createdAt?.toDate() || 'N/A'}\n`;
      fileContent += `Name: ${data?.name || 'Untitled'}\n\n`;

      if (data?.storyParts && Array.isArray(data.storyParts)) {
        fileContent += 'Story Content:\n';
        data.storyParts.forEach((part, index) => {
          fileContent += `--- Part ${index + 1} ---\n`;
          fileContent += `${part.content || 'No content for this part.'}\n\n`;
        });
      } else {
        fileContent += 'Story Content: No story parts found.\n\n';
      }

      fileContent += '------------------------------------------------------------\n\n';

    } catch (error) {
      console.error(`Failed to fetch document ${docId}:`, error);
      fileContent += `Document ID: ${docId}\nStatus: FAILED TO FETCH\n\n`;
      fileContent += '------------------------------------------------------------\n\n';
    }
  }

  fs.writeFileSync(OUTPUT_FILE, fileContent);
  console.log(`Review file created: ${OUTPUT_FILE}`);
};

reviewStories().catch(error => {
  console.error('An unexpected error occurred during the review process:', error);
  process.exit(1);
});
