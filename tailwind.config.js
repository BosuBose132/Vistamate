/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@mieweb/ui/tailwind-preset')],
  content: [
    './client/**/*.{html,js,jsx}',
    './imports/ui/**/*.{js,jsx}',
    './node_modules/@mieweb/ui/dist/**/*.js',
  ],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/forms'), require('daisyui')],
};
