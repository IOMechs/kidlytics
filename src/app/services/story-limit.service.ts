import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

const IDENTIFIER_KEY = 'kidlytics-identifier';

@Injectable({
  providedIn: 'root',
})
export class StoryLimitService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  private getIdentifier(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      let identifier = localStorage.getItem(IDENTIFIER_KEY);
      if (!identifier) {
        identifier = uuidv4();
        localStorage.setItem(IDENTIFIER_KEY, identifier);
      }
      return identifier;
    }
    return null;
  }

  checkLimit(): Observable<{ allowed: boolean }> {
    const identifier = this.getIdentifier();
    if (!identifier) {
      return of({ allowed: true });
    }
    return this.http.post<{ allowed: boolean }>('/api/rateLimiter', {
      identifier,
    });
  }

  validatePassword(password: string): Observable<{ valid: boolean }> {
    const identifier = this.getIdentifier();
    if (!identifier) {
      return of({ valid: false });
    }
    return this.http.post<{ valid: boolean }>('/api/validatePassword', {
      identifier,
      password,
    });
  }
}
