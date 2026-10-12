/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#F8F9FA',
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F1F3F5',
          subtle: '#F8F9FA',
        },
        ink: {
          DEFAULT: '#1E293B',
          soft: '#334155',
          muted: '#64748B',
          faint: '#94A3B8',
        },
        border: {
          DEFAULT: '#E2E8F0',
          strong: '#CBD5E1',
          subtle: '#F1F5F9',
        },
        accent: {
          DEFAULT: '#F97316',
          hover: '#EA580C',
          soft: '#FFF7ED',
        },
        olive: {
          DEFAULT: '#059669',
          hover: '#047857',
          soft: '#ECFDF5',
        },
        danger: {
          DEFAULT: '#EF4444',
          hover: '#DC2626',
          soft: '#FEF2F2',
        },
        text: {
          DEFAULT: '#1E293B',
          muted: '#64748B',
          light: '#94A3B8',
        },
        amber: {
          soft: '#FEF9C3',
          DEFAULT: '#D97706',
        },
        // Colorful Subject Palettes for Kids
        maths: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
        },
        science: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        english: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          200: '#FEF08A',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
        },
        social: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
        },
        fun: {
          coral: '#FF6B6B',
          sunny: '#FFD166',
          emerald: '#06D6A0',
          ocean: '#118AB2',
          navy: '#073B4C',
          purple: '#8338EC',
          pink: '#FF006E',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
        editorial: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 2px 8px -2px rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 12px 24px -6px rgba(15, 23, 42, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.04)',
        'fun': '0 4px 14px 0 rgba(249, 115, 22, 0.25)',
      }
    },
  },
  plugins: [],
}
