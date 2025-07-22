export const STORY_QUESTIONS = [
  {
    question: 'Who is this story for?',
    isMcq: false,
    options: [], // Freeform input: Name and Age
    placeholder:
      'e.g. Susan a 7 years old girl from Italy OR Grade 5 students living in South Asia',
  },
  {
    question: 'What is their age group ',
    isMcq: true,
    options: ['1-5 years', '6-10 years', '11-15 years', '15 and above'],
    placeholder: '',
  },
  {
    question: 'Which language would you like the story to be in',
    isMcq: false,
    options: [],
    placeholder: 'e.g. English',
  },
  {
    question: 'What are their favorite things?',
    isMcq: false,
    options: [], // Freeform input: things they love
    placeholder: 'e.g. Toys, books, animals',
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
    placeholder: '',
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
    placeholder: '',
  },
  {
    question: 'What mood should the story have?',
    isMcq: true,
    options: ['😂 Funny', '🧙 Magical', '😴 Calm', '🧗 Adventurous'],
    placeholder: '',
  },
];
