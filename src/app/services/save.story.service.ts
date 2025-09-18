import { Injectable } from '@angular/core';
import {
  doc,
  updateDoc,
  arrayUnion,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  arrayRemove,
} from 'firebase/firestore';

import { db } from '../../../firebase';

@Injectable({
  providedIn: 'root',
})
export class StorySaveService {
  async saveStory(
    documentId: string,
    uid: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const storiesRef = collection(db, 'stories');

      // Step 1: Count how many stories this user has saved
      const q = query(storiesRef, where('savedBy', 'array-contains', uid));
      const snapshot = await getDocs(q);
      const savedCount = snapshot.size;

      if (savedCount >= 5) {
        return {
          success: false,
          message: 'You can only save up to 5 stories.',
        };
      }

      // Step 2: Check if this story already has the uid in savedBy
      const storyRef = doc(db, `stories/${documentId}`);
      const storySnap = await getDoc(storyRef);

      if (storySnap.exists()) {
        const data = storySnap.data();
        const alreadySaved =
          Array.isArray(data['savedBy']) && data['savedBy'].includes(uid);

        if (alreadySaved) {
          return {
            success: false,
            message: 'You have already saved this story.',
          };
        }
      }

      // Step 3: Add uid to savedBy array
      await updateDoc(storyRef, {
        savedBy: arrayUnion(uid),
      });

      return { success: true, message: 'Story saved successfully.' };
    } catch (error: any) {
      console.error('Error saving story:', error);
      return {
        success: false,
        message: error.message || 'Failed to save story.',
      };
    }
  }

  async getUserStory(uid: string) {
    const storiesRef = collection(db, 'stories');
    const q = query(storiesRef, where('savedBy', 'array-contains', uid));
    const snapshot = await getDocs(q);
    console.log(snapshot.docs);
    return snapshot.docs;
  }
  async removeSavedStory(
    documentId: string,
    uid: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const storyRef = doc(db, `stories/${documentId}`);

      await updateDoc(storyRef, {
        savedBy: arrayRemove(uid),
      });

      return {
        success: true,
        message: 'Story removed from saved list.',
      };
    } catch (error: any) {
      console.error('Error removing saved story:', error);
      return {
        success: false,
        message: error.message || 'Failed to remove saved story.',
      };
    }
  }
}
