import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { Story } from '../model/story.type';
import { db } from '../../../firebase';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StoryService {
  private http = inject(HttpClient);

  getStory(docId: string): Observable<any> {
    return this.http.post<any>(
      'https://us-central1-kidlytics.cloudfunctions.net/getStoryById',
      { docId }
    );
  }

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
