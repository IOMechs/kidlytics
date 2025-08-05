import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../../firebase';

@Injectable({
  providedIn: 'root',
})
export class Testimonial {
  async uploadTestimonial(testimonial: Testimonial): Promise<void> {
    const collRef = collection(db, 'testimonials');
    await addDoc(collRef, testimonial);
  }
}
