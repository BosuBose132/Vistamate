/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './client/**/*.{html,js,jsx}',
        './imports/ui/**/*.{js,jsx}',
    ],
    theme: { extend: {} },
    plugins: [
        require('@tailwindcss/forms'),
        require('daisyui'),
    ],
    // no need for `daisyui.themes` here because you'll define the theme via CSS
};
