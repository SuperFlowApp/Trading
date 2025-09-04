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
        primary2light: '#00eaff',
        primary2normal: '#00B7C9',
        primary2dark: '#008498',
        primary2darker: '#00505c',
        liquidwhite: '#ffffff',
        liquidblack: '#000000',
        liquidlightergray: '#aeaeae',
        liquidmidgray: '#8AABB2',
        liquiddarkgray: '#374151',
        secondary2: '#565A93',
        backgroundlight: '#1e2d3a',
        backgroundlighthover: '#1d2c3c',
        backgroundmid: '#181923',
        backgrounddark: '#02001B',
        liquidRed: '#a44b4b',
        red: '#F59DEF',
        green: '#00B7C9',
      },
      screens: {
        '3xl': '2000px',
        'xl': '1440px',
      },
    },
  },
  plugins: [],
}
