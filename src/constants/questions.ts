export const STORY_QUESTIONS = [
  {
    id: '1',
    question: 'Who is this story for?',
    isMcq: false,
    options: [], // Freeform input: Name and Age
    placeholder:
      'e.g. Susan a 7 years old girl from Italy OR Grade 5 students living in South Asia',
  },
  {
    id: '2',
    question: 'What is their age group ',
    isMcq: true,
    options: ['1-5 years', '6-10 years', '11-15 years', '15 and above'],
    placeholder: '',
  },
  {
    id: '3',
    question: 'Which language would you like the story to be in',
    isMcq: false,
    options: [],
    placeholder: 'e.g. English',
  },
  {
    id: '4',
    question: 'What are their favorite things?',
    isMcq: false,
    options: [], // Freeform input: things they love
    placeholder: 'e.g. Toys, books, animals',
  },
  {
    id: '5',
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
    id: '6',
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
    id: '7',
    question: 'What mood should the story have?',
    isMcq: true,
    options: ['😂 Funny', '🧙 Magical', '😴 Calm', '🧗 Adventurous'],
    placeholder: '',
  },
];
