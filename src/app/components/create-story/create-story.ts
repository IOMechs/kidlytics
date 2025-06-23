import { Component, computed, signal } from '@angular/core';
import { STORY_QUESTIONS } from '../../../contants/questions';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-create-story',
  imports: [FormsModule],
  templateUrl: './create-story.html',
  styleUrl: './create-story.css',
})
export class CreateStory {
  index = signal(0);

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

  goToNext = () => {
    this.index.update((v) => v + 1);
  };

  goToPrev = () => {
    this.index.update((v) => v - 1);
  };

  submitAnswers = () => {
    console.log(this.answers);
  };
}
