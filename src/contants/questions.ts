export const STORY_QUESTIONS = [
  {
    question: 'Who is this story for?',
    isMcq: false,
    options: [], // Freeform input: Name and Age
  },
  {
    question: 'What are their favorite things?',
    isMcq: false,
    options: [], // Freeform input: things they love
  },
  {
    question: 'What kind of world should the story happen in?',
    isMcq: true,
    options: [
      '🌌 Space',
      '🏞️ Jungle',
      '🏰 Magic Kingdom',
      '🌊 Underwater',
      '🏫 School',
      '🏡 Everyday life',
    ],
  },
  {
    question: 'What should the story teach or focus on?',
    isMcq: true,
    options: [
      '🧡 Kindness',
      '💪 Courage',
      '🧠 Curiosity',
      '👫 Friendship',
      '✨ Just for fun',
    ],
  },
  {
    question: 'What mood should the story have?',
    isMcq: true,
    options: ['😂 Funny', '🧙 Magical', '😴 Calm', '🧗 Adventurous'],
  },
];
