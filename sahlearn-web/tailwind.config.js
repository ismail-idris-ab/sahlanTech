/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#16A34A',
          primaryDark: '#15803D',
          primaryLight: '#22C55E',
          accent: '#D97706',
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626',
        },
        ink: {
          900: '#111916',
          700: '#2D3B33',
          500: '#5C7268',
          300: '#B8CCBF',
        },
        surface: {
          100: '#F4F7F2',
          50: '#FAFCF8',
          white: '#FFFFFF',
        },
        forest: {
          950: '#071410',
          900: '#0D2018',
          800: '#122B20',
          700: '#1A3D2C',
          600: '#225038',
          accent: '#4ADE80',
          muted: '#A3C4A8',
          border: 'rgba(255,255,255,0.08)',
        },
        sidebar: {
          bg: '#0D2018',
          text: '#C4D9C9',
          active: '#4ADE80',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.10)',
        green: '0 4px 20px rgba(22,163,74,0.25)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
