/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,vue,ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "0.7rem",
      },
    },
  },
  plugins: [
    require("@tailwindcss/line-clamp"),
    require("@tailwindcss/typography"),
  ],
};
