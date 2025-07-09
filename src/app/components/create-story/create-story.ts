import {
  Component,
  computed,
  inject,
  Output,
  signal,
  EventEmitter,
  input,
  model,
  WritableSignal,
  output,
} from '@angular/core';
import { STORY_QUESTIONS } from '../../../contants/questions';
import { FormsModule } from '@angular/forms';
import { GenerateStory } from '../../services/generate-story';

import {
  StoryGenerationStatus,
  StoryPartWithImg,
} from '../../model/story.type';

@Component({
  selector: 'app-create-story',
  imports: [FormsModule],
  templateUrl: './create-story.html',
  styleUrl: './create-story.css',
})
export class CreateStory {
  index = signal(0);

  loading = input(false);
  loadingEvent = output<boolean>();

  statusEvent = output<StoryGenerationStatus>();

  @Output() storyPart = new EventEmitter<any>();
  @Output() clearStory = new EventEmitter<any>();

  storyService = inject(GenerateStory);

  lengthOfQuestions = STORY_QUESTIONS.length;

  currentQuestion = computed(() => STORY_QUESTIONS[this.index()]);

  isMcq = this.currentQuestion().isMcq;

  answers: Record<string, string> = {};

  get selectedAnswer(): string {
    return this.answers[this.currentQuestion().question] || '';
  }

  set selectedAnswer(value: string) {
    this.answers[this.currentQuestion().question] = value;
  }

  emitLoadingEvent = (state: boolean) => {
    this.loadingEvent.emit(state);
  };

  goToNext = () => {
    this.index.update((v) => v + 1);
  };

  goToPrev = () => {
    this.index.update((v) => v - 1);
  };

  submitAnswers = async () => {
    this.emitLoadingEvent(true);
    this.clearStory.emit();
    this.storyService.getStoryAndImage(this.answers).subscribe((p) => {
      console.log('1');
      console.log(p);
      this.emitLoadingEvent(false);
      this.statusEvent.emit({
        status: p.status,
        message: p.message,
        url: p.url,
      });
    });
    // setTimeout(() => {
    //   console.log('');
    //   this.emitLoadingEvent(false);
    //   this.statusEvent.emit({
    //     status: 'Success',
    //     message: 'Story generated successfully . Please visit the given URL',
    //     url: 'http://localhost:4200/viewStory?id=story-1',
    //   });
    // }, 200);
  };
}
