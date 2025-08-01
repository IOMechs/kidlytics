import {
  Component,
  HostListener,
  input,
  output,
  signal,
  effect,
  inject,
  OnDestroy,
  ViewChild,
  ElementRef,
  OnInit,
} from '@angular/core';
import { StoryPartWithImg } from '../../model/story.type';
import { MatTooltip } from '@angular/material/tooltip';
import { TextToSpeech } from '../../services/text-to-speech';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-story-card',
  imports: [MatTooltip, MatIconModule],
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

  private tts = inject(TextToSpeech);

  imageLoaded = signal(false);

  isLoading = input<boolean>();
  currentIndex = input<number>(0);

  currentImage = input<string>('');
  currentStoryPart = input<StoryPartWithImg>({
    content: '',
    imageUri: '',
  });
  storyLength = input<number>(0);

  audioPart = input<string>();

  changeIndex = output<number>();

  toggleSpeaking = output<boolean>();
  shouldSpeak = input<boolean>();

  onImageLoad(): void {
    this.imageLoaded.set(true);
  }

  @HostListener('window:keydown.arrowright')
  handleKeyRight() {
    this.nextCard();
  }

  @HostListener('swipeleft')
  handleSwipeLeft() {
    this.nextCard();
  }

  @HostListener('window:keydown.arrowleft')
  handleKeyLeft() {
    this.prevCard();
  }

  @HostListener('swiperight')
  handleSwipeRight() {
    this.prevCard();
  }

  prevCard(): void {
    if (this.currentIndex() > 0) {
      if (this.shouldSpeak()) {
        setTimeout(() => this.playAudio(), 200);
      }
      // this.tts.stop();
      this.changeIndex.emit(this.currentIndex() - 1);
    }
  }

  nextCard(): void {
    if (this.currentIndex() < this.storyLength() - 1) {
      if (this.shouldSpeak()) {
        setTimeout(() => this.playAudio(), 200);
      }
      // this.tts.stop();
      this.changeIndex.emit(this.currentIndex() + 1);
      this.imageLoaded.set(false);
    }
  }

  @ViewChild('myAudio') audioRef!: ElementRef<HTMLAudioElement>;

  playAudio() {
    this.audioRef.nativeElement.play();
    this.toggleSpeaking.emit(true);
  }

  pauseAudio() {
    this.toggleSpeaking.emit(false);
    this.audioRef.nativeElement.pause();
  }

  //speak and stop emit events to call speech api from parent so that the speaking state stays persistent across story parts.
  //  This enables the app to automatically start reading next part when card is switched and speech is on

  speak(): void {}

  stop(): void {
    this.toggleSpeaking.emit(false);
  }
}
