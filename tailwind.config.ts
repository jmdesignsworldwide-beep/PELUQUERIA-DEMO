import type { Config } from "tailwindcss";

/**
 * Todos los colores leen CSS variables semánticas definidas en globals.css.
 * Las variables cambian según la piel (data-skin) y el tema (data-theme),
 * así que NINGÚN componente hardcodea un color de marca: solo usa tokens.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
        "accent-contrast": "rgb(var(--accent-contrast) / <alpha-value>)",
        metallic: "rgb(var(--metallic) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgb(var(--accent) / 0.25), 0 8px 30px -8px rgb(var(--accent) / 0.35)",
        layered:
          "0 1px 2px rgb(0 0 0 / 0.06), 0 8px 24px -12px rgb(0 0 0 / 0.25), 0 24px 48px -24px rgb(0 0 0 / 0.30)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "aurora-drift": {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(2%, -3%, 0) scale(1.08)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "aurora-drift": "aurora-drift 14s ease-in-out infinite",
        shimmer: "shimmer 1.8s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
