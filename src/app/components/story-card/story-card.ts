import { Component, EventEmitter, input, output, Output } from '@angular/core';
import { StoryPartWithImg } from '../../model/story.type';

@Component({
  selector: 'app-story-card',
  imports: [],
  templateUrl: './story-card.html',
  styleUrl: './story-card.css',
})
export class StoryCard {
  isLoading = input<boolean>();
  currentIndex = input<number>(0);
  currentImage = input<string>('');
  currentStoryPart = input<StoryPartWithImg>({
    content: '',
    imageUri: '',
  });
  storyLength = input<number>(0);

  changeIndex = output<number>();

  prevCard(): void {
    if (this.currentIndex() > 0) {
      this.changeIndex.emit(this.currentIndex() - 1);
    }
  }

  nextCard(): void {
    if (this.currentIndex() < this.storyLength() - 1) {
      this.changeIndex.emit(this.currentIndex() + 1);
    }
  }
}
