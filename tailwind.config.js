/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          25: '#f0fdf9',
          50: '#e6fffa',
          100: '#b3f5e6',
          500: '#10b981', // Verde Zentratek
          600: '#059669',
          700: '#047857',
        },
        secondary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6', // Azul Zentratek
          600: '#2563eb',
          700: '#1d4ed8',
        },
        success: {
          50: '#e8f5e9',
          500: '#4caf50',
          600: '#388e3c',
        },
        warning: {
          25: '#fffcf0',
          50: '#fff8e1',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        error: {
          50: '#ffebee',
          500: '#f44336',
          600: '#d32f2f',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}