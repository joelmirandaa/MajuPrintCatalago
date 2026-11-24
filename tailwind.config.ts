import type { Config } from 'tailwindcss';

// Tokens extraídos da logo (GuiaDesign.md, seções 3, 4 e 17).
export default {
  content: ['./index.html', './src/app/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '16px', md: '32px' } },
    extend: {
      colors: {
        primaria: { DEFAULT: '#FD6A07', hover: '#E85F00', escura: '#C2410C' },
        secundaria: '#3A1C0C',
        destaque: '#E9A93B',
        fundo: { DEFAULT: '#FFFFFF', secao: '#FFF5EB', alternado: '#FFFAF5' },
        texto: { DEFAULT: '#3A1C0C', suave: '#7A5646' },
        borda: { DEFAULT: '#F0DCCB', campo: '#E3C7B2' },
        skeleton: '#F5E6D8',
        sucesso: '#1F7A4D',
        alerta: '#9A6700',
        erro: '#B42318',
        info: '#1F5FA8',
      },
      fontFamily: {
        titulo: ['Fredoka', 'Nunito', 'sans-serif'],
        corpo: ['Nunito', 'system-ui', 'sans-serif'],
        pincel: ['"Caveat Brush"', 'cursive'],
      },
      borderRadius: { sm: '8px', md: '12px', lg: '20px', xl: '24px', pilula: '999px' },
      boxShadow: {
        cartao: '0 4px 14px rgba(58, 28, 12, 0.08)',
        elevado: '0 8px 24px rgba(58, 28, 12, 0.14)',
        foco: '0 0 0 4px rgba(253, 106, 7, 0.2)',
      },
      maxWidth: { conteudo: '1200px' },
      transitionTimingFunction: { mola: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
      keyframes: {
        brilho: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulsar: { '0%,100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.15)' } },
        deslizar: { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        surgir: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: {
        brilho: 'brilho 1.5s linear infinite',
        pulsar: 'pulsar 1.2s ease-in-out infinite',
        deslizar: 'deslizar 250ms ease-out',
        surgir: 'surgir 400ms ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config;
