/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "rps-blue": "#1E4E8C",
        "rps-amber": "#F59E0B",
        "rps-orange": "#F97316",
        "rps-charcoal": "#111827",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
