/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'forest-green': '#2C4A3C',
        'olive-green': '#5D7B5F',
        'sage-green': '#A8B9A3',
        'cream-beige': '#F5F2E8',
      },
    },
  },
  plugins: [],
}
