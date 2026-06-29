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
        // Sombras tintadas por piel (--shadow-rgb), suaves y difusas (feel 21st.dev).
        soft: "0 1px 2px rgb(var(--shadow-rgb) / 0.04), 0 4px 14px -6px rgb(var(--shadow-rgb) / 0.10)",
        layered:
          "0 1px 2px rgb(var(--shadow-rgb) / 0.05), 0 6px 18px -10px rgb(var(--shadow-rgb) / 0.12), 0 20px 44px -24px rgb(var(--shadow-rgb) / 0.18)",
        pop: "0 2px 6px rgb(var(--shadow-rgb) / 0.07), 0 14px 34px -14px rgb(var(--shadow-rgb) / 0.22)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "aurora-drift": {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(3%, -4%, 0)" },
        },
        "aurora-breathe": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.55" },
          "50%": { transform: "scale(1.14)", opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "shake-x": {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-4px)" },
          "40%, 80%": { transform: "translateX(4px)" },
        },
        "now-pulse": {
          "0%": { transform: "scale(1)", opacity: "0.9" },
          "70%": { transform: "scale(2.4)", opacity: "0" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
      },
      animation: {
        "aurora-drift": "aurora-drift 22s ease-in-out infinite",
        "aurora-breathe": "aurora-breathe 9s ease-in-out infinite",
        shimmer: "shimmer 1.8s infinite",
        "shake-x": "shake-x 0.4s var(--ease-spring)",
        "now-pulse": "now-pulse 2.4s ease-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
