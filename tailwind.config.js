/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['Manrope', 'sans-serif'],
        serif: ['Newsreader', 'serif']
      },
    },
  },
  plugins: [],
}

