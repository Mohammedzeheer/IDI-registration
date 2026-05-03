/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        malayalam: ['"Noto Sans Malayalam"', 'sans-serif'],
        manjari: ['"Manjari"', 'sans-serif'],
        baloo: ['"Baloo Chettan 2"', 'cursive'],
        rachana: ['"Rachana"', 'serif'],
      },
      colors: {
        primary: "#1B165E",
        secondary: "#DDEBEF",
        // primary: "#335C67",
        // secondary: "#DDEBEF",
      },
    },
  },
  plugins: [],
}