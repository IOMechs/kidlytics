import {
  Component,
  computed,
  inject,
  signal,
  input,
  output,
  model,
} from '@angular/core';
import { STORY_QUESTIONS } from '../../../constants/questions';
import { FormsModule } from '@angular/forms';
import { GenerateStory } from '../../services/generate-story';

import { StoryGenerationStatus } from '../../model/story.type';
import { catchError, of } from 'rxjs';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-create-story',
  imports: [FormsModule, MatIcon],
  templateUrl: './create-story.html',
})
export class CreateStory {
  //signals
  index = signal(0);
  currentQuestion = computed(() => STORY_QUESTIONS[this.index()]);

  //injections
  storyService = inject(GenerateStory);

  //outputs
  statusChanged = output<StoryGenerationStatus>();

  //inputs

  loading = model(false);

  lengthOfQuestions = STORY_QUESTIONS.length;
  isMcq = this.currentQuestion().isMcq;

  answers: Record<string, string> = {};

  get selectedAnswer(): string {
    return this.answers[this.currentQuestion().question] || '';
  }

  set selectedAnswer(value: string) {
    this.answers[this.currentQuestion().question] = value;
  }

  goToNext = () => {
    this.index.update((v) => v + 1);
    if (this.currentQuestion().defaultValue && !this.selectedAnswer) {
      this.selectedAnswer = this.currentQuestion().defaultValue || '';
    }
  };

  goToPrev = () => {
    this.index.update((v) => v - 1);
    if (this.currentQuestion().defaultValue && !this.selectedAnswer) {
      this.selectedAnswer = this.currentQuestion().defaultValue || '';
    }
  };

  submitAnswers = async () => {
    this.loading.set(true);

    this.storyService
      .getStoryAndImage(this.answers)
      .pipe(
        catchError((error) => {
          console.error('Error occurred while generating story/image:', error);
          this.loading.set(false);

          this.statusChanged.emit({
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

        this.loading.set(false);

        this.statusChanged.emit({
          status: p.status,
          message: p.message,
          url: p.url,
        });

        console.log(p.url);
      });
  };
}
