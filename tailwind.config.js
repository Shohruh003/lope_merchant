/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Kept in sync with lope_frontend so the two panels feel like
        // one product family.
        brand: {
          DEFAULT: '#7c3aed',
          soft: '#f5f3ff',
        },
      },
    },
  },
  plugins: [],
};
