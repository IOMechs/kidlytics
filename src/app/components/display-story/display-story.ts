import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StoryPartWithImg } from '../../model/story.type';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { StoryCard } from '../story-card/story-card';

@Component({
  selector: 'app-display-story',
  standalone: true,
  templateUrl: './display-story.html',
  styleUrls: ['./display-story.css'],
  imports: [StoryCard],
})
export class DisplayStory implements OnInit {
  // Signals for state
  storyParts = signal<StoryPartWithImg[]>([]);
  storyTitle = signal<string>('');
  isLoading = signal<boolean>(true);
  currentIndex = signal<number>(0);
  error = signal<string | null>(null);
  imagesLoaded = signal<boolean[]>([]);
  preloadedImages = signal<(HTMLImageElement | null)[]>([]);

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    console.log('initing');
    this.route.queryParams.subscribe(async (params) => {
      const id = params['id'];
      if (!id) {
        this.error.set('No story ID found in URL.');
        this.isLoading.set(false);
        return;
      }

      try {
        this.isLoading.set(true);

        const storySnap = await getDoc(doc(db, 'stories', id));

        console.log('data fetched');
        if (!storySnap.exists()) {
          this.error.set('No story found with this ID.');
        } else {
          const data = storySnap.data();
          this.storyParts.set(data['storyParts']);
          this.storyTitle.set(data['name']);

          // Initialize image loaded states
          this.imagesLoaded.set(Array(data['storyParts'].length).fill(false));

          // Preload all images
          this.preloadAllImages();
        }
      } catch (err) {
        console.error(err);
        this.error.set('Error loading story. Please try again.');
      } finally {
        this.isLoading.set(false);
      }
    });
  }

  // Rest of your component methods remain unchanged
  preloadAllImages(): void {
    const newLoadedStates = Array(this.storyParts().length).fill(false);
    const loadedImages: (HTMLImageElement | null)[] = Array(
      this.storyParts().length
    ).fill(null);

    this.storyParts().forEach((part, index) => {
      const img = new Image();
      img.onload = () => {
        newLoadedStates[index] = true;
        loadedImages[index] = img;
        this.imagesLoaded.set([...newLoadedStates]);
        this.preloadedImages.set([...loadedImages]);
      };
      img.onerror = () => {
        console.error(`Failed to load image at index ${index}`);
      };
      img.src = part.imageUri;
    });
  }

  modifyIndex(newIndex: number): void {
    this.currentIndex.set(newIndex);
  }
}
