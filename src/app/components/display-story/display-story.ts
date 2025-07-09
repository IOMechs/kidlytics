import { Component, OnInit, signal, Signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StoryPartWithImg } from '../../model/story.type';
import { stories } from '../../../assets/dummyData';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';

@Component({
  selector: 'app-display-story',
  standalone: true,
  templateUrl: './display-story.html',
  styleUrls: ['./display-story.css'],
})
export class DisplayStory implements OnInit {
  storyParts = signal<StoryPartWithImg[]>([]);

  storyTitle = signal<string>('');

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(async (params) => {
      const id = params['id'];

      if (id) {
        const storyRef = await getDoc(doc(db, 'stories', id));

        if (storyRef.exists()) {
          const data = storyRef.data();
          this.storyParts.set(data['storyParts']);
          this.storyTitle.set(data['name']);
          console.log(this.storyParts.length);
        }
      } else {
        console.warn('No story found for id:', id);
        this.storyParts.set([]);
      }
    });
  }

  currentIndex = 0;

  getStoryParts(): StoryPartWithImg[] {
    return this.storyParts() ?? [];
  }

  getStoryTitle(): string {
    return this.storyTitle() ?? 'Untitled';
  }

  prevCard(): void {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  nextCard(): void {
    if (this.currentIndex < this.storyParts().length - 1) this.currentIndex++;
  }
}
