// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary-color)',
        secondary: 'var(--secondary-color)',
        'bg-light': 'var(--bg-light)',
      },
      fontFamily: {
        main: ['var(--font-main)'],
      },
    },
  },
  plugins: [],
};
