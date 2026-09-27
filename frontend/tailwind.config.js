/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        game: {
          bg: "#0f0e17",
          card: "#1e1b2e",
          purple: "#7c3aed",
          "purple-light": "#a78bfa",
          orange: "#f97316",
          "orange-light": "#fb923c",
          yellow: "#facc15",
          "yellow-light": "#fde047",
          pink: "#ec4899",
          green: "#10b981",
          danger: "#ef4444"
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Cairo', 'sans-serif'],
      },
      animation: {
        'bounce-short': 'bounce 0.5s ease-in-out 2',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ban-stamp': 'banStamp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'shake': 'shake 0.5s ease-in-out',
        'float': 'float 3s ease-in-out infinite'
      },
      keyframes: {
        banStamp: {
          '0%': { transform: 'scale(3) rotate(-25deg)', opacity: '0' },
          '50%': { transform: 'scale(0.9) rotate(-15deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-12deg)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-8px)' },
          '40%, 80%': { transform: 'translateX(8px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' }
        }
      }
    },
  },
  plugins: [],
}
