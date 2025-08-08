import {
  Component,
  OnInit,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { StoryService } from '../../services/story.service';
import { Story, StoryPart, StoryPartWithImg } from '../../model/story.type';
import { FEATURED_STORY_IDS } from '../../../constants/featured-stories';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type TopStoryType = Story & {
  id: string;
  firstImage: string;
};
@Component({
  selector: 'app-top-stories',
  templateUrl: './top-stories.html',
  standalone: true,
  imports: [CommonModule, RouterLink],
})
export class TopStoriesComponent implements OnInit {
  storyService = inject(StoryService);
  featuredStories = signal<TopStoryType[]>([]);

  async ngOnInit() {
    for (const docId of FEATURED_STORY_IDS) {
      const story = await this.storyService.getStoryById(docId);
      console.log(docId, story);
      if (story) {
        const firstImagePart = story.storyParts.find(
          (part) => 'imageUri' in part
        );
        if (firstImagePart) {
          this.featuredStories.update((prev) => {
            return [
              ...prev,
              {
                ...story,
                id: docId,
                firstImage: firstImagePart.imageUri as string,
              },
            ];
          });
        }
      }
    }
  }
}
