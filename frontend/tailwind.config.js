/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#E8ECF4',
          100: '#C5CEDF',
          200: '#A2AFCA',
          300: '#7F90B5',
          400: '#5C71A0',
          500: '#1B2A4A',
          600: '#16233D',
          700: '#121C30',
          800: '#0D1523',
          900: '#080E16',
        },
        nordic: {
          50: '#EEF5FC',
          100: '#D0E5F7',
          200: '#A2CBF0',
          300: '#85BAE9',
          400: '#67A9E1',
          500: '#4A90D9',
          600: '#2F78C8',
          700: '#2563AB',
          800: '#1A4E8E',
          900: '#0F3971',
        },
        warmwhite: '#F8F9FA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'typing-dot': 'typingDot 1.4s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typingDot: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '30%': { transform: 'translateY(-6px)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
