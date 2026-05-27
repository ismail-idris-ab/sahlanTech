/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#068562',       // Royal Ember emerald
          primaryDark: '#056B4E',
          primaryLight: '#71B280',  // Emerald Dusk sage
          accent: '#C9962A',        // Gold from image 2
          success: '#068562',
          warning: '#D97706',
          danger: '#DC2626',
        },
        ink: {
          900: '#0B1C18',
          800: '#172824',
          700: '#253530',
          600: '#3C5048',
          500: '#506860',
          400: '#7A9890',
          300: '#A8C4BC',
        },
        surface: {
          300: '#C2DDD6',
          200: '#D8EAE5',
          100: '#EDF4F2',
          50: '#F5FAF8',
          white: '#FFFFFF',
        },
        forest: {
          950: '#011F28',
          900: '#013F4A',   // Royal Ember deep teal — sidebar
          800: '#0A4A56',
          700: '#134E5E',   // Emerald Dusk dark
          600: '#1A6070',
          sage: '#71B280',  // Emerald Dusk light
          gold: '#C9962A',  // Image 2 gold
          muted: '#87BAC2',
          border: 'rgba(255,255,255,0.07)',
        },
        sidebar: {
          bg: '#013F4A',
          text: '#87BAC2',
          active: '#71B280',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)',
        'card-hover': '0 6px 20px rgba(0,0,0,0.10)',
        emerald: '0 4px 20px rgba(6,133,98,0.30)',
        gold: '0 4px 20px rgba(201,150,42,0.30)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
