/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        catan: {
          wood: '#1e5f38',
          brick: '#b34728',
          wheat: '#e5a823',
          sheep: '#8cb33e',
          ore: '#6c757d',
          desert: '#d4a373',
          water: '#1d3557',
        }
      }
    },
  },
  plugins: [],
}
