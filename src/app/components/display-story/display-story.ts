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
import {
  Component,
  OnInit,
  signal,
  inject,
  Inject,
  OnDestroy,
} from '@angular/core';
import {
  MatDialog,
  MatDialogModule,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { Meta } from '@angular/platform-browser';
import { TextToSpeech, TTSResponseItem } from '../../services/text-to-speech';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { TestimonialDialog } from '../ui/dialog-box/testimonial-dialog';

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

  constructor(private route: ActivatedRoute, private meta: Meta) {}

  ngOnInit(): void {
    window.addEventListener('beforeprint', this.beforePrint);
    window.addEventListener('afterprint', this.afterPrint);

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
          // Initialize image loaded states
          this.imagesLoaded.set(Array(data['storyParts'].length).fill(false));

          // Preload all images
          this.preloadAllImages();

          console.log('here');
          this.tts
            .getAudioFromText(this.storyParts().map((v) => v.content))
            .pipe(
              catchError((err) => {
                console.error('Failed to get audio:', err);
                return of(null); // or throwError(() => err) if you want it to propagate
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

          // Prepare modal content from userPrompt data
          this.prepareModalContent();

          this.meta.removeTag('property="og:title"');
          this.meta.removeTag('property="og:description"');
          this.meta.removeTag('property="og:image"');
          this.meta.removeTag('property="og:url"');
          this.meta.removeTag('property="og:type"');
          this.meta.removeTag('name="twitter:card"');
          this.meta.removeTag('name="twitter:title"');
          this.meta.removeTag('name="twitter:description"');
          this.meta.removeTag('name="twitter:image"');

          // Add basic meta description
          this.meta.updateTag({
            name: 'description',
            content: `${this.storyParts()[0].content.slice(0, 50)}...`,
          });

          // Add Open Graph / Facebook meta tags
          this.meta.addTags([
            { property: 'og:title', content: this.storyTitle() },
            {
              property: 'og:description',
              content: `${this.storyParts()[0].content.slice(0, 50)}...`,
            },
            {
              property: 'og:image',
              content: data['storyParts'][0].imageUri || '',
            },
            { property: 'og:type', content: 'article' },
          ]);

          // Add Twitter meta tags
          this.meta.addTags([
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: this.storyTitle() },
            {
              name: 'twitter:description',
              content: `${this.storyParts()[0].content.slice(0, 50)}...`,
            },
            {
              name: 'twitter:image',
              content: data['storyParts'][0].imageUri || '',
            },
          ]);
        }
      } catch (err) {
        console.error(err);
        this.error.set('Error loading story. Please try again.');
      } finally {
        this.isLoading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeprint', this.beforePrint);
    window.removeEventListener('afterprint', this.afterPrint);
    this.speakingSignal.set(false);
  }

  private beforePrint = () => {
    this.isPrinting.set(true);
  };

  private afterPrint = () => {
    this.isPrinting.set(false);
  };

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

  modifyIndex(newIndex: number): void {
    this.currentIndex.set(newIndex);
  }

  getShareUrl(): string {
    return window.location.href;
  }

  print(): void {
    // Manually trigger the printing state to ensure the print view is rendered
    this.isPrinting.set(true);

    // Use a timeout to allow Angular to render the print view before the print dialog opens.
    // This helps prevent race conditions. The `afterprint` event will handle
    // setting `isPrinting` back to false.
    setTimeout(() => {
      window.print();
    }, 100);
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
