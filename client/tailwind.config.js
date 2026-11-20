/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg': '#FFFFFF',
        'brand-soft': '#FFF8F7',
        'brand-text': '#DD695B',
        'brand-text-body': '#6B4A47',
        'brand-gold': '#D4AF37',
        'brand-gold-soft': '#F6E7B4',
        'brand-coral-soft': '#FFE9E6',
        'success': '#4CAF8F',
        'warning': '#E8B84A',
        'danger': '#E5736B',
      },
      boxShadow: {
        'card': '0 10px 30px rgba(221, 105, 91, 0.18), 0 2px 8px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 16px 40px rgba(221, 105, 91, 0.28), 0 4px 12px rgba(0, 0, 0, 0.06)',
        'button': '0 6px 16px rgba(221, 105, 91, 0.35)',
        'focus-coral': '0 0 0 4px rgba(221, 105, 91, 0.25)',
      },
      borderRadius: {
        'card': '32px',
        'card-sm': '24px',
        'card-img': '28px',
        'input': '20px',
        'modal': '36px',
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

