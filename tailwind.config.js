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
          50: '#f0f8ff',
          100: '#e3f2fd',
          500: '#2196f3',
          600: '#1976d2',
        },
        success: {
          50: '#e8f5e9',
          500: '#4caf50',
          600: '#388e3c',
        },
        warning: {
          50: '#fff8e1',
          500: '#ff9800',
          600: '#f57c00',
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