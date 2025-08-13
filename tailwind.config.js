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
        primary2active: '#00eaff',
        primary2deactive: '#00505c',
        primary2deactiveactive: '#0099b0',
        backgroundlighthover:'#1d2c3c',
        liquidwhite: '#8AABB2',
        secondary2: '#565A93',
        backgroundlight: '#202534',
        backgroundmid:'#121622',
        backgrounddark: '#02001B',
        warningcolor: '#a44b4b',
        red: '#ff3e68',
        green: '#2DC08E',
      },
    },
  },
  plugins: [],
}
