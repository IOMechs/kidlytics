import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { isPlatformServer } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class StoryMetaResolver implements Resolve<any> {
  constructor(
    private meta: Meta,
    private title: Title,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async resolve(route: ActivatedRouteSnapshot) {
    const id = route.queryParams['id'];

    if (!id) {
      // Set default meta tags if no story ID
      this.setDefaultMetaTags();
      return null;
    }

    try {
      const storySnap = await getDoc(doc(db, 'stories', id));

      if (storySnap.exists()) {
        const data = storySnap.data();
        const storyTitle = data['name'] || 'Story';
        const storyContent =
          data['storyParts']?.[0]?.content || 'A wonderful story for children';
        const ageGroup = data['ageGroup'] || '5+';
        const language = data['language'] || 'English';

        // Set document title
        this.title.setTitle(`${storyTitle} - Kidlytics`);

        // Set meta tags for SEO and social sharing
        this.meta.updateTag({ property: 'og:title', content: storyTitle });
        this.meta.updateTag({
          property: 'og:description',
          content: storyContent,
        });
        this.meta.updateTag({ property: 'og:type', content: 'article' });

        // Handle URL for both server and client side
        const baseUrl = isPlatformServer(this.platformId)
          ? 'https://kidlytics.firebaseapp.com'
          : window.location.origin;
        this.meta.updateTag({
          property: 'og:url',
          content: `${baseUrl}/viewStory?id=${id}`,
        });

        this.meta.updateTag({
          name: 'twitter:card',
          content: 'summary_large_image',
        });
        this.meta.updateTag({ name: 'twitter:title', content: storyTitle });
        this.meta.updateTag({
          name: 'twitter:description',
          content: storyContent,
        });

        this.meta.updateTag({ name: 'description', content: storyContent });
        this.meta.updateTag({
          name: 'keywords',
          content: `children story, ${ageGroup}, ${language}`,
        });

        // Set title
        this.meta.updateTag({ property: 'og:site_name', content: 'Kidlytics' });

        // Only return data on server-side to avoid duplicate loading on client
        if (isPlatformServer(this.platformId)) {
          return data;
        }

        return null;
      } else {
        this.setDefaultMetaTags();
        return null;
      }
    } catch (error) {
      console.error('Error fetching story for meta tags:', error);
      this.setDefaultMetaTags();
      return null;
    }
  }

  private setDefaultMetaTags() {
    this.title.setTitle('Story - Kidlytics');
    this.meta.updateTag({ property: 'og:title', content: 'Story - Kidlytics' });
    this.meta.updateTag({
      property: 'og:description',
      content: 'Discover wonderful stories for children',
    });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({
      name: 'description',
      content: 'Discover wonderful stories for children',
    });
  }
}
