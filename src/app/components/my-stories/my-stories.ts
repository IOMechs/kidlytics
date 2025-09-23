import { Component, inject, effect, signal } from '@angular/core';
import { StorySaveService } from '../../services/save.story.service';
import { AuthStore } from '../../services/auth.store';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-my-stories',
  templateUrl: './my-stories.html',
  styleUrls: ['./my-stories.css'],
  imports: [CommonModule, RouterLink],
})
export class UserStoriesComponent {
  userStories = signal<any[]>([]);
  loading = signal(true);
  isModalOpen = signal(false);
  selectedStoryId = signal<string | null>(null);

  private readonly storyService = inject(StorySaveService);
  private readonly authService = inject(AuthStore);

  constructor() {
    // reactively respond to auth changes
    effect(async () => {
      const user = this.authService.user(); // signal
      if (user?.uid) {
        this.loading.set(true);
        try {
          const stories = await this.storyService.getUserStory(user.uid);

          const storiesArray = stories.map((v) => ({ ...v.data(), id: v.id }));
          this.userStories.set(storiesArray);
          console.log(this.userStories());
          this.loading.set(false);
        } catch (err) {
          console.error('Error loading stories:', err);
        } finally {
          this.loading.set(false);
        }
      }
    });
  }

  openConfirmationModal(storyId: string): void {
    this.selectedStoryId.set(storyId);
    this.isModalOpen.set(true);
  }

  closeConfirmationModal(): void {
    this.isModalOpen.set(false);
    this.selectedStoryId.set(null);
  }

  async confirmUnsave(): Promise<void> {
    const storyId = this.selectedStoryId();
    const user = this.authService.user();

    if (storyId && user?.uid) {
      const result = await this.storyService.removeSavedStory(
        storyId,
        user.uid
      );
      if (result.success) {
        this.userStories.update((stories) =>
          stories.filter((story) => story.id !== storyId)
        );
      } else {
        // Optional: handle error with a user-facing message
        console.error('Failed to unsave story:', result.message);
      }
      this.closeConfirmationModal();
    }
  }
}