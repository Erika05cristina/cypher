/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#0a0a0a',
          red: '#ff003c',
          green: '#00ff9f',
          blue: '#00f0ff'
        }
      }
    },
  },
  plugins: [],
}