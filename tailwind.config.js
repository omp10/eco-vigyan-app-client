/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "primary": "#4C7C32",
        "primary-light": "#E9F2E6",
        "accent": "#F9F506",
        "background-light": "#FDFDFB",
        "background-dark": "#1A1C18",
        "earth": "#795548",
        // Legacy colors kept for compatibility where possible
        "accent-amber": "#C98B3B",
        "card-light": "#f4ede6",
        "accent-brown": "#9E8C7A",
        "accent-green": "#2d4a22", 
      },
      fontFamily: {
        "display": ["Public Sans", "sans-serif"],
        "body": ["Manrope", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
      },
    },
  },
  plugins: [],
}
