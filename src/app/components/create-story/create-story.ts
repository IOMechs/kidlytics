import {
  Component,
  computed,
  inject,
  signal,
  output,
  model,
  afterNextRender,
} from '@angular/core';
import { STORY_QUESTIONS } from '../../../constants/questions';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { GenerateStory } from '../../services/generate-story';
import { StoryLimitService } from '../../services/story-limit.service';
import { ERROR_CODES } from '../../../constants/error.codes';

import { StoryGenerationStatus } from '../../model/story.type';
import { catchError, of, switchMap } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-create-story',
  imports: [FormsModule, MatIcon, ReactiveFormsModule],
  templateUrl: './create-story.html',
})
export class CreateStory {
  //signals
  formState = signal<'initial' | 'blueprint' | 'customizing'>('initial');
  initialStoryPrompt = signal('');
  blueprintAnswers = signal<Record<string, string> | null>(null);

  index = signal(0);
  currentQuestion = computed(() => STORY_QUESTIONS[this.index()]);
  showPasswordInput = signal(false);
  password = signal('');
  limitReached = signal(false);

  //injections
  storyService = inject(GenerateStory);
  storyLimitService = inject(StoryLimitService);

  //outputs
  statusChanged = output<StoryGenerationStatus>();

  //inputs
  loading = model(false);

  lengthOfQuestions = STORY_QUESTIONS.length;
  readonly STORY_QUESTIONS = STORY_QUESTIONS;

  answerToQuestions = new FormGroup({});

  constructor() {
    afterNextRender(() => {
      this.storyLimitService.checkLimit().subscribe({
        next: (res) => {
          if (!res.allowed) {
            this.limitReached.set(true);
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error checking limit:', error);
          if (error.status === 429) {
            this.limitReached.set(true);
          }
        },
      });
    });

    STORY_QUESTIONS.map((v) => {
      this.answerToQuestions.addControl(
        v.question,
        new FormControl('', Validators.required)
      );
    });
  }

  get selectedAnswer(): string {
    return (
      this.answerToQuestions.get(this.currentQuestion().question)?.value || ''
    );
  }

  set selectedAnswer(value: string) {
    this.answerToQuestions
      .get(this.currentQuestion().question)
      ?.setValue(value);
  }

  togglePasswordInput() {
    this.showPasswordInput.set(!this.showPasswordInput());
  }

  submitPassword() {
    this.storyLimitService.validatePassword(this.password()).subscribe({
      next: (res) => {
        if (res.valid) {
          this.limitReached.set(false);
          this.showPasswordInput.set(false);
        }
      },
    });
  }

  previousQuestionIndex: number = 0;

  goToNext = () => {
    this.previousQuestionIndex = this.index();
    this.index.update((v) => v + 1);
  };

  goToPrev = () => {
    this.previousQuestionIndex = this.index();
    this.index.update((v) => v - 1);
  };

  generateBlueprint() {
    if (!this.initialStoryPrompt().trim()) {
      return;
    }
    this.loading.set(true);
    this.storyService
      .getStoryBlueprint(this.initialStoryPrompt())
      .pipe(
        catchError((error: HttpErrorResponse) => {
          this.handleError(error);
          return of(null);
        })
      )
      .subscribe((blueprint) => {
        this.loading.set(false);
        if (blueprint) {
          this.answerToQuestions.patchValue(blueprint);

          this.blueprintAnswers.set(blueprint);
          this.formState.set('blueprint');
        }
      });
  }

  confirmAndGenerate() {
    // `this.answers` is already populated from the blueprint

    this.submitAnswers();
  }

  customize() {
    this.formState.set('customizing');
    this.index.set(0);
  }

  startOver() {
    this.formState.set('initial');
    this.initialStoryPrompt.set('');
    this.answerToQuestions.reset();
    this.blueprintAnswers.set(null);
    this.index.set(0);
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    this.loading.set(false);

    const apiError = error.error?.error;
    const defaultError = ERROR_CODES.UNKNOWN_ERROR;

    if (error.status === 429) {
      this.limitReached.set(true);
    }

    this.statusChanged.emit({
      status: 'Error',
      message: apiError?.message || defaultError.message,
      url: '',
      errorCode: apiError?.code || defaultError.code,
    });
  }

  submitAnswers = async () => {
    this.loading.set(true);

    this.answerToQuestions.setControl(
      'Initial Prompt',
      new FormControl(this.initialStoryPrompt())
    );
    this.storyLimitService
      .checkLimit()
      .pipe(
        switchMap((res) => {
          if (!res.allowed) {
            this.limitReached.set(true);
            this.loading.set(false);
            return of(null);
          }
          return this.storyService.getStoryAndImage(
            this.answerToQuestions.value
          );
        }),
        catchError((error: HttpErrorResponse) => {
          this.handleError(error);
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

        this.startOver();
      });
  };
}
