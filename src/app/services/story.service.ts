import { inject, Injectable } from '@angular/core';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { Story } from '../model/story.type';
import { db } from '../../../firebase';

@Injectable({
  providedIn: 'root',
})
export class StoryService {
  async getStoryById(docId: string): Promise<Story | undefined> {
    const docRef = doc(db, 'stories', docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as Story;
    } else {
      console.log('No such document!');
      return undefined;
    }
  }
}
