import { SocialShare } from '../social-share/social-share';
import { ActivatedRoute } from '@angular/router';
import { StoryPartWithImg } from '../../model/story.type';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { StoryCard } from '../story-card/story-card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject, Inject } from '@angular/core';
import {
  MatDialog,
  MatDialogModule,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';

@Component({
  selector: 'app-display-story',
  standalone: true,
  templateUrl: './display-story.html',
  styleUrls: ['./display-story.css'],
  imports: [
    StoryCard,
    MatDialogModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    CommonModule,
    SocialShare,
  ],
})
export class DisplayStory implements OnInit {
  // Signals for state
  storyParts = signal<StoryPartWithImg[]>([]);
  storyTitle = signal<string>('');
  userPrompt = signal<Record<string, string>>({});
  ageGroup = signal<string>('');
  isLoading = signal<boolean>(true);
  currentIndex = signal<number>(0);
  error = signal<string | null>(null);
  imagesLoaded = signal<boolean[]>([]);
  preloadedImages = signal<(HTMLImageElement | null)[]>([]);

  // For modal content
  modalContent = signal<{
    title: string;
    content: { question: string; answer: string }[];
  }>({
    title: 'Story Details',
    content: [],
  });

  readonly dialog = inject(MatDialog);

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
          console.log(data);
          this.storyParts.set(data['storyParts']);
          this.storyTitle.set(data['name']);
          this.userPrompt.set({
            ...data['userPrompt'],
            'Generated On': this.formatDate(data['createdAt']),
          });
          this.ageGroup.set(data['ageGroup']);
          // Initialize image loaded states
          this.imagesLoaded.set(Array(data['storyParts'].length).fill(false));

          // Preload all images
          this.preloadAllImages();

          // Prepare modal content from userPrompt data
          this.prepareModalContent();
        }
      } catch (err) {
        console.error(err);
        this.error.set('Error loading story. Please try again.');
      } finally {
        this.isLoading.set(false);
      }
    });
  }

  formatDate(timestamp: any): string {
    const milliseconds =
      timestamp.seconds * 1000 + timestamp.nanoseconds / 1_000_000;
    const date = new Date(milliseconds);
    return date.toLocaleString();
  }

  prepareModalContent(): void {
    const content: { question: string; answer: string }[] = [];

    // Process userPrompt data for the modal
    const promptData = this.userPrompt();
    for (const question in promptData) {
      content.push({
        question,
        answer: promptData[question],
      });
    }

    this.modalContent.set({
      title: 'Info Given by User for Story Generation',
      content,
    });
  }

  openDialog(): void {
    this.dialog.open(DialogBox, {
      data: this.modalContent(),
      width: '500px',
    });
  }

  maxRetries = 3;

  preloadAllImages(retriesLeft = this.maxRetries): void {
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
      img.onerror = (e) => {
        console.error(`Failed to load image at index ${index}: ${e}`);
        if (retriesLeft > 0) {
          setTimeout(() => this.preloadAllImages(retriesLeft - 1), 1000);
          console.warn(
            `Giving up loading image at index ${index} after max retries.`
          );
        }
      };
      img.src = part.imageUri;
    });
  }

  modifyIndex(newIndex: number): void {
    this.currentIndex.set(newIndex);
  }

  getShareUrl(): string {
    return window.location.href;
  }
}

@Component({
  selector: 'dialog-box',
  standalone: true,
  imports: [MatDialogModule, CommonModule],
  template: `
    <h2
      mat-dialog-title
      class="text-xl font-bold text-[var(--secondary-color)]"
    >
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      <div class="prompt-details">
        <div *ngFor="let item of data.content" class="my-3">
          <div class="question font-semibold">{{ item.question }}</div>
          <div class="answer text-gray-700">{{ item.answer }}</div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button
        mat-button
        mat-dialog-close
        class="bg-[var(--secondary-color)] text-white px-4 py-2 rounded"
      >
        Close
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogBox {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
