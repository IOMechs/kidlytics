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

  generateImage(
    {
      imagePrompt,
      prevImgUrl,
    }: { imagePrompt: string; prevImgUrl: string | null },
    seed?: number
  ): Observable<string> {
    return this.http
      .post<{ imageUri: string }>(this.url + '/api/imageGen', {
        imagePrompt,
        prevImgUrl,
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

    const cleanValue = (str: string | undefined): string | undefined => {
      if (!str) {
        return undefined;
      }
      // This regex removes most emojis and symbols, then trims whitespace.
      return str
        .replace(
          /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
          ''
        )
        .trim();
    };

    return this.getStoryFromGemini(userContext).pipe(
      switchMap((story) => {
        storyName = story.title;
        userPrompt = userContext;
        ageGroup = story.ageGroup;
        return from(story.parts.map((part, index) => ({ ...part, index })));
      }),
      concatMap((partObj) => {
        let imagePromptWithContext = `Current Scene Prompt: ${partObj.imagePrompt}

        Instructions for this new image to be generated:
          - Style: Keep the illustration cartoonish and animated.
          - If you get another image in the context, use it as a reference for the style, facial features, etc.
          - Do not include any text or labels in the image.
          - If there's a previous image, ensure the characters and objects are consistent with the previous images in terms of design, colors, and overall look.
          - If there is a previous image, do not include it in the new image, but ensure the new image continues the story from the previous one.
          - If there is no previous image, create a new scene that fits the story context.
          - Ensure the image is suitable for children aged ${ageGroup} and does not contain any inappropriate content.
          - The image should be colorful, engaging, and visually appealing to children.
          - The image should be suitable for a story about ${storyName}.
`;
        return this.generateImage(
          {
            imagePrompt: imagePromptWithContext,
            prevImgUrl: prevImgBaseUrl,
          },
          seed
        ).pipe(
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
          language:
            userContext['Which language would you like the story to be in']?.toLowerCase(),
          world: cleanValue(
            userContext['What kind of world should the story happen in?']
          ),
          lesson: cleanValue(
            userContext['What should the story teach or focus on?']
          ),
          mood: cleanValue(userContext['What mood should the story have?']),
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
