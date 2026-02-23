/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Will be customizable via trust center settings
        primary: {
          DEFAULT: '#007bff',
          dark: '#0056b3',
        },
        secondary: {
          DEFAULT: '#6c757d',
          dark: '#545b62',
        },
      },
    },
  },
  plugins: [],
};

