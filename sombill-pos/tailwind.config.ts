import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3',
          600: '#1976D2',
          700: '#0D47A1',
          800: '#1565c0',
          900: '#0d47a1',
        },
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        ibmPlex: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        'xl': '18px',
        '2xl': '18px',
      },
    },
  },
  plugins: [],
}
export default config
