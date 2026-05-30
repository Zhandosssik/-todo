/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#080808',
          card: '#111111',
        },
        accent: {
          DEFAULT: '#FF4D00',
          success: '#00FF88',
        },
        border: '#1F1F1F',
        muted: '#888888',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      maxWidth: {
        mobile: '390px',
      },
      transitionDuration: {
        screen: '300ms',
      },
    },
  },
  plugins: [],
};
