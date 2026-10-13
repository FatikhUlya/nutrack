import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#17191B',
        'bg-alt': '#1E2124',
        surface: {
          DEFAULT: '#202326',
          elevated: '#292D30',
          hover: '#303539',
          dark: '#121416',
        },
        border: {
          DEFAULT: '#383D41',
          subtle: '#2D3134',
        },
        'text-primary': '#F4F5F6',
        'text-secondary': '#A7ADB3',
        'text-muted': '#747C83',
        accent: {
          DEFAULT: '#D6FF3F',
          hover: '#C7F02D',
          contrast: '#17191B',
          soft: 'rgba(214, 255, 63, 0.15)',
        },
        brand: {
          DEFAULT: '#D6FF3F',
          dark: '#9AC600',
          soft: 'rgba(214, 255, 63, 0.12)',
        },
        success: '#65D99A',
        warning: '#FFBF69',
        danger: '#FF6B73',
        info: '#77B7FF',
        carb: '#67E8F9',
        protein: '#77B7FF',
        fat: '#C4B5FD',
        chart: {
          calories: '#D6FF3F',
          protein: '#77B7FF',
          carbs: '#67E8F9',
          fat: '#C4B5FD',
        },
      },
      fontFamily: {
        // SF Pro (via -apple-system) on Apple devices, Segoe UI on Windows, Helvetica Neue / Arial elsewhere
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          "'SF Pro Display'",
          "'SF Pro Text'",
          "'Segoe UI Variable'",
          "'Segoe UI'",
          "'Helvetica Neue'",
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        display: ['38px', { lineHeight: '1.1', fontWeight: '800' }],
        h1: ['30px', { lineHeight: '1.2', fontWeight: '700' }],
        h2: ['23px', { lineHeight: '1.3', fontWeight: '700' }],
        h3: ['19px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        body: ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      borderRadius: {
        sm: '10px',
        DEFAULT: '14px',
        md: '18px',
        lg: '22px',
        xl: '26px',
        '2xl': '30px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.35)',
        elevated: '0 6px 20px rgba(0, 0, 0, 0.5)',
        modal: '0 12px 40px rgba(0, 0, 0, 0.7)',
        'neon-glow': '0 0 20px rgba(214, 255, 63, 0.35)',
        'neon-glow-lg': '0 0 35px rgba(214, 255, 63, 0.5)',
        'blue-glow': '0 0 20px rgba(103, 232, 249, 0.35)',
        'focus-accent': '0 0 0 2px #D6FF3F',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        slow: '300ms',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      maxWidth: {
        content: '1200px',
        sidebar: '280px',
      },
    },
  },
  plugins: [],
};

export default config;
