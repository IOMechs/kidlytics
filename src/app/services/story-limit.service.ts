import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StoryLimitService {
  private http = inject(HttpClient);

  constructor() {}

  validatePassword(password: string) {
    return this.http.post('/api/validatePassword', { password }).pipe(
      tap({
        error: (err) => console.error('Password validation failed', err),
      })
    );
  }
}
