/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        'foreground-light': 'hsl(var(--foreground-light) / <alpha-value>)',
        'foreground-dark': 'hsl(var(--foreground-dark) / <alpha-value>)',
        'white-light': 'hsl(var(--white-light) / <alpha-value>)',
        primary: 'hsl(var(--primary) / <alpha-value>)',
        'white-dark': 'hsl(var(--white-dark) / <alpha-value>)',
        dark: 'hsl(var(--dark) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}

