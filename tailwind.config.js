/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand: deep emerald-teal leaf
        leaf: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        soil: {
          50: '#fdf8f0',
          100: '#faebd7',
          200: '#f5d5a8',
          300: '#edb96c',
          400: '#d9954a',
          500: '#c4762e',
          600: '#a35a20',
          700: '#84431a',
          800: '#6b3518',
          900: '#572c16',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      screens: {
        xs: '400px',
        800: '800px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')({ strategy: 'class' })],
}
