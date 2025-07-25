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

  generateImage(imagePrompt: string, seed?: number): Observable<string> {
    return this.http
      .post<{ imageUri: string }>(this.url + '/api/imageGen', {
        imagePrompt,
        seed,
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
    let userPrompt: Record<string, string> = {};
    let ageGroup = '5+';
    let prevImgBaseUrl = '';
    let prevImgPrompt = '';
    let seed = Math.floor(Math.random() * 10);
    return this.getStoryFromGemini(userContext).pipe(
      switchMap((story) => {
        storyName = story.title;
        userPrompt = userContext;
        ageGroup = story.ageGroup;
        return from(story.parts.map((part, index) => ({ ...part, index })));
      }),
      concatMap((partObj) => {
        let imagePromptWithContext = `Current Scene Prompt: ${partObj.imagePrompt}

        Reference: This image continues the story from the previously generated image: ${prevImgBaseUrl}

        Previous Prompt: ${prevImgPrompt}

        Instructions:
          - Ensure the same characters and objects appear with consistent looks across both images (e.g., facial features, clothing, colors, accessories).
          - Maintain overall visual consistency with the previous image in terms of character design, objects, and setting.
          - Style: Keep the illustration cartoonish and animated.
`;
        return this.generateImage(imagePromptWithContext, seed).pipe(
          switchMap((base64Image) => {
            prevImgPrompt = partObj.imagePrompt;
            // Upload image to Firebase Storage
            const imagePath = `stories/${Date.now()}-part-${partObj.index}.png`;
            const imageRef = ref(storage, imagePath);
            return from(uploadString(imageRef, base64Image, 'data_url')).pipe(
              switchMap(() => from(getDownloadURL(imageRef))),
              map((downloadUrl) => {
                prevImgBaseUrl = downloadUrl;
                return {
                  content: partObj.content,
                  imageUri: downloadUrl,
                };
              })
            );
          })
        );
      }),
      toArray(),
      concatMap((storyPartsWithImages: StoryPartWithImg[]) => {
        const storyDoc = {
          name: storyName,
          storyParts: storyPartsWithImages,
          createdAt: new Date(),
          userPrompt,
          ageGroup,
        };

        try {
          return from(addDoc(collection(db, 'stories'), storyDoc)).pipe(
            map((docRef) => ({
              status: 'Success' as const,
              message:
                'Your story has been generated. Click the link below and enjoy reading...',
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
