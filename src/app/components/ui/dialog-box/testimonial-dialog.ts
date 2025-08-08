import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { Testimonial } from '../../../services/testimonial';

@Component({
  selector: 'app-dialog-box',
  imports: [
    MatDialogActions,
    MatDialogClose,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './testimonial-dialog.html',
})
export class TestimonialDialog {
  data = inject(MAT_DIALOG_DATA);
  testimonialService = inject(Testimonial);
  feedbackForm: FormGroup;
  ratings = [1, 2, 3, 4, 5];

  constructor(
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.feedbackForm = this.fb.group({
      name: ['', Validators.required],
      rating: [
        null,
        [Validators.required, Validators.min(1), Validators.max(5)],
      ],
      feedback: ['', [Validators.required, Validators.maxLength(300)]],
    });
  }

  ratingHasError() {
    const control = this.feedbackForm.get('rating');
    return (
      control?.touched && (control?.hasError('min') || control?.hasError('max'))
    );
  }

  async submitFeedback() {
    if (this.feedbackForm.valid) {
      console.log('Feedback submitted:', this.feedbackForm.value);
      try {
        await this.testimonialService.uploadTestimonial(
          this.feedbackForm.value
        );
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('feedbackSubmitted', 'true');
        }
      } catch (e) {
        console.log(e);
      }

      // Optionally reset the form
      this.feedbackForm.reset();
    }
  }
}
