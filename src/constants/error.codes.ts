export const ERROR_CODES = {
  // General Errors (1000-1999)
  UNKNOWN_ERROR: {
    code: 1000,
    message: 'An unknown error occurred. Please try again later.',
  },
  SERVER_ERROR: {
    code: 1001,
    message:
      'A server error occurred. Our team has been notified. Please try again later.',
  },

  // Story Generation Errors (2000-2999)
  STORY_GENERATION_FAILED: {
    code: 2000,
    message:
      'Failed to generate the story text. The AI model might be overloaded. Please try again.',
  },
  BLUEPRINT_GENERATION_FAILED: {
    code: 2001,
    message:
      "Failed to generate story ideas. The AI model might be having trouble with the prompt. Please try rephrasing your idea or click 'Start Over'.",
  },

  // Image Generation Errors (3000-3999)
  IMAGE_GENERATION_FAILED: {
    code: 3000,
    message:
      'Failed to generate an image. The AI model might be overloaded. Please try again.',
  },
  IMAGE_SAFETY_BLOCK: {
    code: 3001,
    message:
      'Could not generate an image due to safety restrictions. Please try a different prompt for the story.',
  },
  IMAGE_URI_MISSING: {
    code: 3002,
    message: 'An image was generated, but its data is missing. Please try again.',
  },

  // Firebase Errors (4000-4999)
  FIREBASE_SAVE_FAILED: {
    code: 4000,
    message: 'Failed to save the story to our database. Please try again later.',
  },

  // Rate Limiting / Permissions (5000-5999)
  RATE_LIMIT_EXCEEDED: {
    code: 5000,
    message: 'You have reached the generation limit for this device.',
  },
};

export type AppError = {
  code: number;
  message: string;
};
