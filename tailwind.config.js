/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'sm': '768px',   // tablet
      'md': '1024px',  // desktop
      'lg': '1280px',  // large desktop
      'xl': '1536px',  // extra large
    },
    extend: {
      colors: {
        primary: {
          50: '#f0f0f0',
          100: '#e0e0e0',
          200: '#c6c6c6',
          300: '#a6a6a6',
          400: '#8a8a8a',
          500: '#6e6e6e',
          600: '#5c5c5c',
          700: '#4a4a4a',
          800: '#383838',
          900: '#262626',
        },
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        medieval: {
          gold: '#d4af37',
          darkgold: '#b8941f',
          copper: '#b87333',
          iron: '#4a4a4a',
          stone: '#8b8680',
          wood: '#8b4513',
          parchment: '#f4e4bc',
          inkblack: '#1a1a1a',
        },
        background: {
          dark: '#0f0f0f',
          darker: '#0a0a0a',
          card: '#1a1a1a',
          modal: '#262626',
        }
      },
      fontFamily: {
        'pixel': ['Press Start 2P', 'monospace'],
        'pixel-alt': ['Silkscreen', 'monospace'],
        'pixel-body': ['JetBrains Mono', 'Space Mono', 'monospace'],
        'dnd': ['Orbitron', 'Press Start 2P', 'monospace'], // D&D style main titles
        'fantasy-epic': ['Cinzel', 'Spectral', 'serif'], // Epic fantasy titles
        'fantasy-elegant': ['EB Garamond', 'Crimson Text', 'serif'], // Elegant fantasy text
        'fantasy-classic': ['Spectral', 'Crimson Text', 'serif'], // Classic medieval
        'medieval-narrative': ['EB Garamond', 'Georgia', 'Crimson Text', 'serif'], // Medieval narrative text - optimized for readability
        'medieval-options': ['MedievalSharp', 'Caesar Dressing', 'serif'], // Medieval choice options
        'medieval-decorative': ['Cinzel Decorative', 'Uncial Antiqua', 'serif'], // Decorative medieval
        'medieval': ['Orbitron', 'JetBrains Mono', 'monospace'], 
        'fantasy': ['Space Mono', 'JetBrains Mono', 'monospace'],
        'sans': ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'parchment': "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJwYXJjaG1lbnQiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CiAgICAgIDxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2Y0ZTRiYyIvPgogICAgICA8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiIGZpbGw9IiNlZGQ0YTAiLz4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXJjaG1lbnQpIi8+Cjwvc3ZnPgo=')",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(212, 175, 55, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.8)' },
        },
      },
    },
  },
  plugins: [],
}

