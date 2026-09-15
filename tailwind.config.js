/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0E1013",
          900: "#14171C",
          800: "#1B1F26",
          700: "#242932",
          600: "#31373F",
          500: "#454C56",
        },
        parchment: {
          100: "#EDEAE2",
          200: "#D9D4C7",
          300: "#B7B0A0",
        },
        brass: {
          400: "#D9B968",
          500: "#C9A24B",
          600: "#A8823A",
        },
        teal: {
          400: "#4F9A86",
          500: "#3E7C6B",
          600: "#2E5F52",
        },
        clay: {
          400: "#CB7360",
          500: "#B85C4A",
          600: "#96473A",
        },
      },
      fontFamily: {
        display: ["'Source Serif 4'", "Georgia", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
