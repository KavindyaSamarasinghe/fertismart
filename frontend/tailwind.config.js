/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        "brand-bg": "#F8FAFC",
        "brand-green": "#1C3D20",
        "brand-green-light": "#eef7ee",
      },
    },
  },
  plugins: [],
};
