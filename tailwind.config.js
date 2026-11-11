/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#0F172A', // slate-900
        },
        surface: {
          DEFAULT: '#1E293B', // slate-800
          subtle: '#334155',  // slate-700
        },
        brand: {
          primary: '#2563EB', // blue-600
          hover: '#1D4ED8',   // blue-700
          focus: '#3B82F6',   // blue-500
        },
        status: {
          success: '#10B981', // emerald-500
          danger: '#EF4444',  // rose-500
          info: '#06B6D4',    // cyan-500
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        'card': '0.75rem',  // rounded-xl
        'modal': '1rem',    // rounded-2xl
      }
    },
  },
  plugins: [],
}

