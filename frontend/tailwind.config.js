/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cypher: {
          bg:       '#0c0a0f',   /* fondo negro violáceo       */
          surface:  '#15101e',   /* tarjetas                   */
          border:   '#2a1f3d',   /* bordes sutiles             */
          pink:     '#f72585',   /* acento principal — magenta */
          violet:   '#7b2fbe',   /* acento secundario          */
          orange:   '#f4501e',   /* alerta / crítico           */
          amber:    '#f7931e',   /* advertencia / medio        */
          soft:     '#ffd6ec',   /* texto suave sobre dark     */
          muted:    '#7a6b8a',   /* texto secundario           */
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['"Inter"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
        'scan':       'scan 2s linear infinite',
      },
      keyframes: {
        glow: {
          '0%':   { boxShadow: '0 0 5px #f72585, 0 0 10px #f72585' },
          '100%': { boxShadow: '0 0 20px #f72585, 0 0 40px #7b2fbe' },
        },
        scan: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
      },
    },
  },
  plugins: [],
}