import { Injectable, inject, signal, computed } from '@angular/core';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../../firebase';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  // signals
  private readonly _user = signal<User | null>(null);
  readonly user = computed(() => this._user());
  readonly isLoggedIn = computed(() => !!this._user());

  constructor() {
    // Subscribe to Firebase auth changes
    onAuthStateChanged(auth, (firebaseUser) => {
      this._user.set(firebaseUser);
      console.log('STate changed', this.isLoggedIn());
    });
  }

  // useful getter
  get currentUser(): User | null {
    return this._user();
  }
}
