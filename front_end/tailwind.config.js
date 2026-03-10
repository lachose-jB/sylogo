/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#E85D04', 50: '#FFF0E6', 100: '#FFD9B3', 500: '#E85D04', 700: '#9C3D02' },
        dark: { DEFAULT: '#1A1A2E', 800: '#16213E', 900: '#0F0F0F' },
      },
      keyframes: {
        'slide-in': {
          '0%':   { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
