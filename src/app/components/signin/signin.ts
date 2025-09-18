import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-signin',
  imports: [ReactiveFormsModule],
  templateUrl: './signin.html',
  styleUrl: './signin.css',
})
export class Signin {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly isValid = computed(() => this.form.valid);

  async onEmailLogin(): Promise<void> {
    if (!this.form.valid) return;
    this.loading.set(true);
    this.error.set(null);

    try {
      const { email, password } = this.form.getRawValue();
      const user = await this.auth.emailSignIn(email, password);
      console.log(user);
    } catch (err: unknown) {
      this.error.set((err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async onGoogleLogin(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const user = await this.auth.googleSignIn();
      console.log(user);
      this.router.navigate(['/story']);
      // show toast, save user object in local storage and navigate to create page
    } catch (err: unknown) {
      this.error.set((err as Error).message);
    } finally {
      this.loading.set(false);
    }
  }
}
