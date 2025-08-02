/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        purple: {
          600: "#9333ea",
          700: "#7c3aed",
        },
      },
      fontFamily: {
        avenir: ["Avenir Next", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
