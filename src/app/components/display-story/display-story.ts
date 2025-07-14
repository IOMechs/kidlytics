import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StoryPartWithImg } from '../../model/story.type';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';

@Component({
  selector: 'app-display-story',
  standalone: true,
  templateUrl: './display-story.html',
  styleUrls: ['./display-story.css'],
  imports: [],
})
export class DisplayStory implements OnInit {
  // Signals for state
  storyParts = signal<StoryPartWithImg[]>([]);
  storyTitle = signal<string>('');
  isLoading = signal<boolean>(true);
  currentIndex = signal<number>(0);
  error = signal<string | null>(null);

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(async (params) => {
      const id = params['id'];
      if (!id) {
        this.error.set('No story ID found in URL.');
        this.isLoading.set(false);
        return;
      }

      try {
        this.isLoading.set(true);

        const storySnap = await getDoc(doc(db, 'stories', id));

        if (!storySnap.exists()) {
          this.error.set('No story found with this ID.');
        } else {
          const data = storySnap.data();
          this.storyParts.set(data['storyParts']);
          this.storyTitle.set(data['name']);
        }
      } catch (err) {
        console.error(err);
        this.error.set('Error loading story. Please try again.');
      } finally {
        this.isLoading.set(false);
      }
    });
  }

  // Navigation
  prevCard(): void {
    if (this.currentIndex() > 0) this.currentIndex.update((p) => p - 1);
  }

  nextCard(): void {
    if (this.currentIndex() < this.storyParts().length - 1)
      this.currentIndex.update((p) => p + 1);
  }

  onSwipe(evt: any) {
    const x =
      Math.abs(evt.deltaX) > 40 ? (evt.deltaX > 0 ? 'right' : 'left') : '';
    const y = Math.abs(evt.deltaY) > 40 ? (evt.deltaY > 0 ? 'down' : 'up') : '';
    console.log(`${x} ${y}`);
  }
}
