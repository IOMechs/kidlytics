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
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnInit,
  signal,
  inject,
  Inject,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformServer } from '@angular/common';
import {
  MatDialog,
  MatDialogModule,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { Meta, Title } from '@angular/platform-browser';
import { TextToSpeech, TTSResponseItem } from '../../services/text-to-speech';

import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { TestimonialDialog } from '../ui/dialog-box/testimonial-dialog';
import { generateStoryPdf } from '../../utils/pdfGenertor';
import { StoryService } from '../../services/story.service';

@Component({
  selector: 'app-display-story',
  standalone: true,
  templateUrl: './display-story.html',
  styleUrl: './display-story.css',
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
export class DisplayStory implements OnInit, OnDestroy {
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
  isPrinting = signal(false);
  speakingSignal = signal(false);
  storyAudio = signal<string[]>([]);
  storyLanguage = signal<string>('');

  testimonialDialog = inject(MatDialog);

  // For modal content
  modalContent = signal<{
    title: string;
    content: { question: string; answer: string }[];
  }>({
    title: 'Story Details',
    content: [],
  });

  readonly dialog = inject(MatDialog);
  private tts = inject(TextToSpeech);
  private storyService = inject(StoryService);

  constructor(
    private route: ActivatedRoute,
    private meta: Meta,
    private title: Title,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    let id: string = '';
    this.route.queryParams.subscribe(async (params) => {
      id = params['id'];
      if (id === '' || !id) {
        this.error.set('No story ID found in URL.');
        this.isLoading.set(false);
        return;
      }
    });
    if (isPlatformServer(this.platformId)) {
      this.storyService.getStory(id).subscribe((storyData) => {
        // this.storyParts.set(storyData.storyParts);
        // this.storyTitle.set(storyData.name);
        // this.userPrompt.set({
        //   ...storyData.userPrompt,
        //   'Generated On': this.formatDate(storyData.createdAt),
        // });
        // this.ageGroup.set(storyData.ageGroup || '5+');
        // this.storyLanguage.set(storyData.language);
        // this.imagesLoaded.set(Array(storyData.storyParts.length).fill(false));
        // this.storyAudio.set(Array(storyData.storyParts.length).fill(''));
        // this.preloadAllImages();
        // this.prepareModalContent();
        this.isLoading.set(false);

        const storyTitle = storyData.name || 'Story';
        const storyContent =
          storyData.storyParts?.[0]?.content ||
          'A wonderful story for children';
        const ageGroup = storyData.ageGroup || '5+';
        const language = storyData.language || 'English';

        this.title.setTitle(`${storyTitle} - Kidlytics`);

        this.meta.updateTag({ property: 'og:title', content: storyTitle });
        this.meta.updateTag({
          property: 'og:description',
          content: storyContent,
        });
        this.meta.updateTag({ property: 'og:type', content: 'article' });

        const baseUrl = 'https://kidlytics.firebaseapp.com';
        this.meta.updateTag({
          property: 'og:url',
          content: `${baseUrl}/viewStory?id=-O-pDA9ySg3xIe2zTURI`,
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

        this.meta.updateTag({
          property: 'og:site_name',
          content: 'Kidlytics',
        });
      });
      return;
    }
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromQueryParams();
    }
  }

  private loadFromQueryParams(): void {
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

        if (!storySnap.exists()) {
          this.error.set('No story found with this ID.');
        } else {
          const data = storySnap.data();
          this.storyParts.set(data['storyParts']);
          this.storyTitle.set(data['name']);
          this.userPrompt.set({
            ...data['userPrompt'],
            'Generated On': this.formatDate(data['createdAt']),
          });
          this.ageGroup.set(data['ageGroup'] || '5+');
          this.storyLanguage.set(data['language']);
          // Initialize image loaded states
          this.imagesLoaded.set(Array(data['storyParts'].length).fill(false));

          // Preload all images
          this.preloadAllImages();

          console.log('here');
          this.loadAudio(data['storyParts']);

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

  private loadAudio(storyParts: StoryPartWithImg[]): void {
    console.log(isPlatformBrowser(this.platformId), 'PLatfrom Browser');
    this.tts
      .getAudioFromText(storyParts.map((v) => v.content))
      .pipe(
        catchError((err) => {
          console.error('Failed to get audio:', err);
          return of(null);
        })
      )
      .subscribe((audioBase64) => {
        if (!audioBase64) return;

        const audioUrls: string[] = audioBase64.data.map(
          (data: TTSResponseItem) => {
            const { base64 } = data;
            const base64Data = base64.includes(',')
              ? base64.split(',')[1]
              : base64;

            // Decode base64 to binary
            const binary = atob(base64Data);
            const bytes = new Uint8Array(binary.length);

            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }

            // Create blob and object URL
            const blob = new Blob([bytes], { type: 'audio/wav' });
            return URL.createObjectURL(blob);
          }
        );

        this.storyAudio.set(audioUrls);
        console.log(this.storyAudio());
      });
  }

  ngOnDestroy(): void {
    this.speakingSignal.set(false);
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

  openTestimonialDialog(): void {
    this.testimonialDialog.open(TestimonialDialog);
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

  checkFeedbackSubmitted(): boolean {
    if (isPlatformServer(this.platformId)) {
      return false;
    }
    return localStorage.getItem('feedbackSubmitted')?.includes('true') || false;
  }

  modifyIndex(newIndex: number): void {
    this.currentIndex.set(newIndex);
  }

  getShareUrl(): string {
    return window.location.href;
  }

  async print(): Promise<void> {
    this.isPrinting.set(true);
    console.log('print');
    let storyData = [...this.storyParts()];
    storyData = storyData.map((v, i) => ({
      content: v.content,
      imageUri: this.preloadedImages()[i]?.src || '',
    }));
    await generateStoryPdf(this.storyTitle(), storyData);
    this.isPrinting.set(false);
  }

  handleSpeech(shouldSpeak: boolean) {
    this.speakingSignal.set(shouldSpeak);
  }
}

@Component({
  selector: 'dialog-box',
  standalone: true,
  imports: [MatDialogModule, CommonModule],
  template: `
    <h2 mat-dialog-title class="text-xl font-bold text-secondary">
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
      <button mat-button mat-dialog-close class="btn btn-primary">Close</button>
    </mat-dialog-actions>
  `,
})
export class DialogBox {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}
}
