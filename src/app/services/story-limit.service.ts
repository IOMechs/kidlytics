import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class StoryLimitService {
  private readonly storageKey = 'storyGenerationCount';
  private readonly unlimitedKey = 'unlimitedGeneration';
  private readonly limit = environment.storyGenerationLimit;
  private readonly enabled = environment.enableStoryGenerationLimit;
  private http = inject(HttpClient);

  constructor() {}

  canGenerateStory(): boolean {
    if (sessionStorage.getItem(this.unlimitedKey) === 'true') {
      return true;
    }
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

  validatePassword(password: string) {
    this.http.post('/api/validatePassword', { password }).subscribe({
      next: (res: any) => {
        if (res.valid) {
          sessionStorage.setItem(this.unlimitedKey, 'true');
        }
      },
      error: (err) => {
        console.error('Password validation failed', err);
      }
    });
  }
}
