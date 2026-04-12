import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        killer: {
          bg: '#0a0a0f',
          surface: '#1a1a2e',
          card: '#16213e',
          red: '#CC0000',
          'red-dark': '#8B0000',
          'red-glow': '#ff1a1a',
          blue: '#1e3a5f',
          'blue-glow': '#4a9eff',
          gold: '#B8860B',
          text: '#e0e0e0',
          'text-dim': '#888888',
          night: '#050510',
        },
        poker: {
          felt: '#2d0a0a',
          'felt-light': '#3d1515',
          wood: '#5C3317',
          'wood-light': '#8B5A2B',
          'wood-dark': '#3B1F0B',
          'card-back': '#4a0e0e',
          'card-gold': '#C5A55A',
        },
        blood: {
          DEFAULT: '#8B0000',
          bright: '#CC0000',
          dark: '#4a0000',
          drip: '#6B0000',
        },
      },
      fontFamily: {
        game: ['Rubik', 'Arial', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};

export default config;
