/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 品牌
        brand: {
          blue: 'var(--brand-blue)',
          sky: 'var(--brand-sky)',
          pink: 'var(--brand-pink)',
          deep: 'var(--brand-deep)',
        },
        // 蓝色阶
        primary: {
          200: 'var(--primary-200)',
          light: 'var(--primary-light)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
        },
        // 文本
        ink: {
          DEFAULT: 'var(--text-primary)',
          heading: 'var(--text-heading)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          helper: 'var(--text-helper)',
        },
        // 表面
        surface: {
          DEFAULT: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          dark: 'var(--surface-dark)',
        },
        // 边框
        line: {
          light: 'var(--border-light)',
          DEFAULT: 'var(--border-gray)',
        },
      },
      fontFamily: {
        ui: 'var(--font-ui)',
        display: 'var(--font-display)',
        mid: 'var(--font-mid)',
        data: 'var(--font-data)',
      },
      borderRadius: {
        tag: '4px',
        std: '8px',
        comfy: '12px',
        gen: '20px',
        large: '24px',
        pill: '9999px',
      },
      boxShadow: {
        standard: 'var(--shadow-standard)',
        soft: 'var(--shadow-soft)',
        brand: 'var(--shadow-brand)',
        'brand-offset': 'var(--shadow-brand-offset)',
        elevated: 'var(--shadow-elevated)',
      },
      spacing: {
        section: '80px',
        'section-sm': '64px',
      },
      maxWidth: {
        content: '1120px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: 'var(--shadow-brand)' },
          '50%': { boxShadow: 'var(--shadow-brand-offset)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease both',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
