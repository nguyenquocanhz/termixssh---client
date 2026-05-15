/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        termix: {
          bg: '#0d1117',
          sidebar: '#0c1420',
          panel: '#080c12',
          border: '#1e2530',
          input: '#111827',
          inputborder: '#1e2d3d',
          text: '#e2e8f0',
          textMuted: '#64748b',
          textDark: '#374151',
          primary: '#3b82f6',
          primaryHover: '#60a5fa',
          success: '#4ade80',
          warning: '#fbbf24',
          danger: '#ef4444',
        }
      },
      keyframes: {
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      animation: {
        scaleIn: 'scaleIn 0.15s ease-out forwards',
        fadeIn: 'fadeIn 0.15s ease-out forwards',
      }
    },
  },
  plugins: [],
}

