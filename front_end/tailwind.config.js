/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#E85D04', 50: '#FFF0E6', 100: '#FFD9B3', 500: '#E85D04', 700: '#9C3D02' },
        dark: { DEFAULT: '#1A1A2E', 800: '#16213E', 900: '#0F0F0F' },
      },
    },
  },
  plugins: [],
};
