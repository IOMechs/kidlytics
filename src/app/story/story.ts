import { Component, inject, signal, WritableSignal } from '@angular/core';
import { CreateStory } from '../components/create-story/create-story';
import { DisplayStory } from '../components/display-story/display-story';
import {
  ModalContentT,
  StoryGenerationStatus,
  StoryPartWithImg,
} from '../model/story.type';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { DialogBox } from '../components/ui/dialog-box/dialog-box';

@Component({
  selector: 'app-story',
  imports: [CreateStory, MatButtonModule],
  templateUrl: './story.html',
  styleUrl: './story.css',
})
export class Story {
  isLoading: WritableSignal<boolean> = signal(false);

  modalContent: WritableSignal<ModalContentT> = signal({
    status: 'Error',
    message: 'Story not processed yet',
    showModal: false,
  });

  storyParts: WritableSignal<StoryPartWithImg[]> = signal([
    {
      content: 'Hello',
      imageUri: 'https://i.dawn.com/primary/2016/02/56d0964eec3bb.jpg',
    },
  ]);

  readonly dialog = inject(MatDialog);

  openDialog() {
    this.dialog.open(DialogBox, {
      data: this.modalContent(),
    });
  }

  toggleLoadingBar(state: boolean) {
    console.log(state);
    this.isLoading.set(state);
  }

  toggleModal(currentState: StoryGenerationStatus) {
    this.modalContent.set({
      ...currentState,
      showModal: true,
    });
    this.openDialog();
  }

  closeModal() {
    this.modalContent.update((prev) => {
      return {
        ...prev,
        showModal: false,
      };
    });
  }

  addPart(part: StoryPartWithImg) {
    this.storyParts.update((p) => {
      p.push(part);
      return p;
    });
  }

  clearStory() {
    this.storyParts.set([]);
  }
}
