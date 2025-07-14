import { Component, inject, signal, WritableSignal } from '@angular/core';
import { CreateStory } from '../components/create-story/create-story';
import { ModalContentT, StoryGenerationStatus } from '../model/story.type';
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

  readonly dialog = inject(MatDialog);

  openDialog() {
    this.dialog.open(DialogBox, {
      data: this.modalContent(),
    });
  }

  toggleLoadingBar(state: boolean) {
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
}
