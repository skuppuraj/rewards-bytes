export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#f5f3ff', 100: '#ede9fe', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9', 900: '#4c1d95' },
        brand: { DEFAULT: '#6366f1', dark: '#4f46e5', light: '#818cf8' }
      }
    }
  },
  plugins: []
};
