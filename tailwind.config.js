/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary1: '#F59DEF',
        primary2: '#00B7C9',
        primary2deactive: '#00B7C980',
        secondary1: '#8AABB2',
        secondary2: '#565A93',
        backgroundlight: '#161A2C',
        backgrounddark: '#02001Bdd',
        warningcolor: '#a44b4b',
      },
    },
  },
  plugins: [],
}
