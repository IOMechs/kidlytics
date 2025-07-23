import {
  Component,
  computed,
  inject,
  signal,
  input,
  output,
} from '@angular/core';
import { STORY_QUESTIONS } from '../../../constants/questions';
import { FormsModule } from '@angular/forms';
import { GenerateStory } from '../../services/generate-story';

import { StoryGenerationStatus } from '../../model/story.type';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-create-story',
  imports: [FormsModule],
  templateUrl: './create-story.html',
  styleUrl: './create-story.css',
})
export class CreateStory {
  //signals
  index = signal(0);
  currentQuestion = computed(() => STORY_QUESTIONS[this.index()]);

  //injections
  storyService = inject(GenerateStory);

  //outputs
  loadingEvent = output<boolean>();
  statusEvent = output<StoryGenerationStatus>();

  //inputs

  loading = input(false);

  lengthOfQuestions = STORY_QUESTIONS.length;
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
    this.storyService
      .getStoryAndImage(this.answers)
      .pipe(
        catchError((error) => {
          console.error('Error occurred while generating story/image:', error);
          this.emitLoadingEvent(false);

          this.statusEvent.emit({
            status: 'Error',
            message: 'Failed to generate story or image. Please try again.',
            url: '',
          });

          // Return an empty observable to stop further processing
          return of(null);
        })
      )
      .subscribe((p) => {
        if (!p) return; // already handled in catchError

        this.emitLoadingEvent(false);

        this.statusEvent.emit({
          status: p.status,
          message: p.message,
          url: p.url,
        });

        console.log(p.url);
      });
  };
}
