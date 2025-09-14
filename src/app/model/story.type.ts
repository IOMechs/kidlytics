export type StoryPart = {
  content: string;
  imageUrl: string;
};

export type StoryPartWithImg = {
  content: string;
  imageUri: string;
};

export type StoryGenerationStatus = {
  status: 'Error' | 'Success';
  message: string;
  url?: string;
  errorCode?: number;
};

export type ModalContentT = StoryGenerationStatus & {
  showModal: boolean;
};

export type Story = {
  storyParts: StoryPart[];
  name: string;
  ageGroup: string;
  language: string;
};

export type Testimonial = {
  name: string;
  rating: number;
  feedback: string;
};
