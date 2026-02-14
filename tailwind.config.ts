import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0F0F14',
        accent: '#FF3B3B',
        logic: '#FFD166',
        success: '#4CAF50'
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace']
      },
      letterSpacing: {
        tightest: '-0.04em'
      }
    }
  },
  plugins: []
} satisfies Config;
