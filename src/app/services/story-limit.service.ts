import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StoryLimitService {
  private readonly storageKey = 'storyGenerationCount';
  private readonly limit = environment.storyGenerationLimit;
  private readonly enabled = environment.enableStoryGenerationLimit;

  constructor() {}

  canGenerateStory(): boolean {
    if (!this.enabled) {
      return true;
    }
    return this.getGenerationCount() < this.limit;
  }

  incrementGenerationCount(): void {
    if (!this.enabled) {
      return;
    }
    const currentCount = this.getGenerationCount();
    if (currentCount < this.limit) {
      sessionStorage.setItem(this.storageKey, String(currentCount + 1));
    }
  }

  getGenerationCount(): number {
    const count = sessionStorage.getItem(this.storageKey);
    return count ? parseInt(count, 10) : 0;
  }

  getLimit(): number {
    return this.limit;
  }
}
