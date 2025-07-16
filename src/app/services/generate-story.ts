import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  StoryGenerationStatus,
  StoryPartWithImg,
  Story,
} from '../model/story.type';
import {
  catchError,
  concatMap,
  from,
  map,
  Observable,
  of,
  switchMap,
  toArray,
} from 'rxjs';
import { addDoc, collection } from 'firebase/firestore';
import { db, storage } from '../../../firebase'; // make sure Firebase is initialized
import { getDownloadURL, ref, uploadString } from 'firebase/storage';

@Injectable({
  providedIn: 'root',
})
export class GenerateStory {
  http = inject(HttpClient);

  url = environment.apiUrl;

  getStoryFromGemini(userContext: Record<string, string>) {
    let usersPreference = '';
    for (const [key, value] of Object.entries(userContext)) {
      usersPreference += `${key} : ${value} \n`;
    }
    return this.http.post<Story>(this.url + '/api/generateStory', {
      userContext: usersPreference,
    });
  }

  generateImage(imagePrompt: string): Observable<string> {
    return this.http
      .post<{ imageUri: string }>(this.url + '/api/imageGen', {
        imagePrompt,
      })
      .pipe(
        map((res) => {
          if (!res.imageUri) {
            throw new Error('Image URI missing from response');
          }
          console.log('Image generated');
          console.log(res.imageUri.slice(0, 10));
          return `${res.imageUri}`;
        })
      );
  }

  getStoryAndImage(
    userContext: Record<string, string>
  ): Observable<StoryGenerationStatus> {
    let storyName = `Untitled Story`;

    return this.getStoryFromGemini(userContext).pipe(
      switchMap((story) => {
        storyName = story.title;
        return from(story.parts.map((part, index) => ({ ...part, index })));
      }),
      concatMap((partObj) =>
        this.generateImage(partObj.content).pipe(
          switchMap((base64Image) => {
            // Upload image to Firebase Storage
            const imagePath = `stories/${Date.now()}-part-${partObj.index}.png`;
            const imageRef = ref(storage, imagePath);
            return from(uploadString(imageRef, base64Image, 'data_url')).pipe(
              switchMap(() => from(getDownloadURL(imageRef))),
              map((downloadUrl) => ({
                content: partObj.content,
                imageUri: downloadUrl,
              }))
            );
          })
        )
      ),
      toArray(),
      concatMap((storyPartsWithImages: StoryPartWithImg[]) => {
        const storyDoc = {
          name: storyName,
          storyParts: storyPartsWithImages,
          createdAt: new Date(),
        };

        try {
          return from(addDoc(collection(db, 'stories'), storyDoc)).pipe(
            map((docRef) => ({
              status: 'Success' as const,
              message: 'Story generated and stored in Firestore successfully.',
              url: `${environment.FRONTEND_BASE_URL}/viewStory?id=${docRef.id}`,
            }))
          );
        } catch (e) {
          return of({
            status: 'Error' as const,
            message: 'Failed to save story. Please try again later.',
            url: '',
          });
        }
      })
    );
  }
}
