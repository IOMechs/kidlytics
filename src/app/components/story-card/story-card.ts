import {
  Component,
  EventEmitter,
  input,
  output,
  Output,
  signal,
  effect,
} from '@angular/core';
import { StoryPartWithImg } from '../../model/story.type';
import { MatTooltip } from '@angular/material/tooltip';

@Component({
  selector: 'app-story-card',
  imports: [MatTooltip],
  templateUrl: './story-card.html',
})
export class StoryCard {
  constructor() {
    effect((): void => {
      // This will run every time currentImage() changes
      const img = this.currentImage();
      if (img) {
        this.imageLoaded.set(false); // reset loading state
      }
    });
  }

  imageLoaded = signal(false);

  isLoading = input<boolean>();
  currentIndex = input<number>(0);

  currentImage = input<string>('');
  currentStoryPart = input<StoryPartWithImg>({
    content: '',
    imageUri: '',
  });
  storyLength = input<number>(0);

  changeIndex = output<number>();

  onImageLoad(): void {
    this.imageLoaded.set(true);
  }

  prevCard(): void {
    if (this.currentIndex() > 0) {
      this.changeIndex.emit(this.currentIndex() - 1);
    }
  }

  nextCard(): void {
    if (this.currentIndex() < this.storyLength() - 1) {
      this.changeIndex.emit(this.currentIndex() + 1);
      this.imageLoaded.set(false);
    }
  }
}
