/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        neural: {
          900: "#0A0B0F",
          800: "#13151C",
          700: "#1A1D2E",
          600: "#2A2D3E",
          500: "#6366F1",
          400: "#818CF8",
          300: "#A5B4FC",
        },
      },
    },
  },
  plugins: [],
};
