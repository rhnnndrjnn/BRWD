/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        earth: {
          50: "#F6F1EF",
          100: "#ECE4DF",
          200: "#DAC8BE",
          300: "#C7AD9E",
          400: "#B5927D",
          500: "#A2765D",
          600: "#825F4A",
          700: "#614738",
          800: "#412F25",
          900: "#201813",
          950: "#17110D",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
