/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#1E5AA8',
          primaryDark: '#163F75',
          accent: '#F5B400',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
        ink: {
          900: '#0F172A',
          700: '#334155',
          500: '#64748B',
          300: '#CBD5E1',
        },
        surface: {
          100: '#F8FAFC',
          white: '#FFFFFF',
        },
        sidebar: {
          bg: '#0B1220',
          text: '#E2E8F0',
          active: '#F5B400',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
