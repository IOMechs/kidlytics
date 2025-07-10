import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
  StoryGenerationStatus,
  StoryPart,
  StoryPartWithImg,
  Story,
} from '../model/story.type';
import { concatMap, from, map, Observable, of, switchMap, toArray } from 'rxjs';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../../firebase'; // make sure Firebase is initialized

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
      .post<{ imageBase64: string }>(this.url + '/api/imageGen', {
        imagePrompt,
      })
      .pipe(
        map((res) => {
          if (!res.imageBase64) throw new Error('Failed to generate image');
          return `data:image/png;base64,${res.imageBase64}`;
        })
      );
    // return of(
    //   'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.freechildrenstories.com%2F&psig=AOvVaw2Hwg8XC75Kit3hFRSXi9L8&ust=1750947167237000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCODBh9HgjI4DFQAAAAAdAAAAABAE'
    // );
  }

  getStoryAndImage(
    userContext: Record<string, string>
  ): Observable<StoryGenerationStatus> {
    let storyName = `Untitled Story`;

    return this.getStoryFromGemini(userContext).pipe(
      switchMap((story) => {
        storyName = story.title;
        return from(story.parts);
      }),
      concatMap((part) =>
        this.generateImage(part.content).pipe(
          map((imageUri) => ({
            content: part.content,
            imageUri,
          }))
        )
      ),
      toArray(),
      concatMap((storyPartsWithImages: StoryPartWithImg[]) => {
        const storyDoc = {
          name: storyName,
          storyParts: storyPartsWithImages,
          createdAt: new Date(),
        };
        // Add new document and let Firestore assign the ID
        return from(addDoc(collection(db, 'stories'), storyDoc)).pipe(
          map((docRef) => ({
            status: 'Success' as const,
            message: 'Story generated and stored in Firestore successfully.',
            url: `http://localhost:4200/viewStory?id=${docRef.id}`,
          }))
        );
      })
    );
  }
}
