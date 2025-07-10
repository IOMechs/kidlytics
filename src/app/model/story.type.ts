export type StoryPart = {
  content: string;
  imagePrompt: string;
};

export type StoryPartWithImg = {
  content: string;
  imageUri: string;
};

export type StoryGenerationStatus = {
  status: 'Error' | 'Success';
  message: string;
  url?: string;
};

export type ModalContentT = StoryGenerationStatus & {
  showModal: boolean;
};

export type Story = {
  parts: StoryPart[];
  title: string;
};
