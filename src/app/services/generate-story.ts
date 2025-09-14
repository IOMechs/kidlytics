import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  StoryGenerationStatus,
  StoryPartWithImg,
  Story,
} from '../model/story.type';
import { concatMap, from, map, Observable, of, switchMap, toArray } from 'rxjs';
import { addDoc, collection } from 'firebase/firestore';
import { db, storage } from '../../../firebase'; // make sure Firebase is initialized
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import { StoryLimitService } from './story-limit.service';

@Injectable({
  providedIn: 'root',
})
export class GenerateStory {
  http = inject(HttpClient);
  storyLimitService = inject(StoryLimitService);

  url = environment.apiUrl;

  getStoryFromGemini(userContext: Record<string, string>) {
    let usersPreference = '';
    for (const [key, value] of Object.entries(userContext)) {
      usersPreference += `${key} : ${value} \n`;
    }
    const identifier = this.storyLimitService.getIdentifier();
    return this.http.post<Story>(this.url + '/api/generateStory', {
      userContext: usersPreference,
      identifier,
    });
  }

  getStoryBlueprint(userContext: string) {
    return this.http.post<Record<string, string>>(
      this.url + '/api/generateBlueprint',
      {
        userContext,
      }
    );
  }

  generateImage({
    imagePrompt,
    prevImgUrl,
  }: {
    imagePrompt: string;
    prevImgUrl: string | null;
  }): Observable<string> {
    return this.http
      .post<{ imageUri: string }>(this.url + '/api/imageGen', {
        imagePrompt,
        prevImgUrl,
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
    const cleanValue = (str: string | undefined): string | undefined => {
      if (!str) {
        return undefined;
      }
      return str
        .replace(
          /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
          ''
        )
        .trim();
    };

    return this.getStoryFromGemini(userContext).pipe(
      switchMap((story) => {
        // The story from Gemini now includes base64 image data in imageUrl
        // We need to upload these to Firebase storage and get the download URLs
        const uploadTasks = story.storyParts.map((part, index) => {
          const imagePath = `stories/${Date.now()}-part-${index}.png`;
          const imageRef = ref(storage, imagePath);
          return from(uploadString(imageRef, part.imageUrl, 'data_url')).pipe(
            switchMap(() => from(getDownloadURL(imageRef))),
            map((downloadUrl) => ({
              content: part.content,
              imageUri: downloadUrl, // Firebase URL
            }))
          );
        });

        return from(uploadTasks).pipe(
          concatMap((task) => task),
          toArray(),
          map((storyPartsWithImages) => ({
            ...story,
            storyParts: storyPartsWithImages,
          }))
        );
      }),
      concatMap((storyWithFirebaseImages) => {
        const storyDoc = {
          name: storyWithFirebaseImages.name,
          storyParts: storyWithFirebaseImages.storyParts,
          createdAt: new Date(),
          userPrompt: userContext,
          ageGroup: storyWithFirebaseImages.ageGroup,
          language:
            userContext[
              'Which language would you like the story to be in'
            ]?.toLowerCase(),
          world: cleanValue(
            userContext['What kind of world should the story happen in?']
          ),
          lesson: cleanValue(
            userContext['What should the story teach or focus on?']
          ),
          mood: cleanValue(userContext['What mood should the story have?']),
        };

        return from(addDoc(collection(db, 'stories'), storyDoc)).pipe(
          map((docRef) => ({
            status: 'Success' as const,
            message:
              'Your story has been generated. Click the link below and enjoy reading...',
            url: `${environment.FRONTEND_BASE_URL}/viewStory?id=${docRef.id}`,
          }))
        );
      })
    );
  }
}
