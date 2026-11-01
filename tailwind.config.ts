import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      // Brand palettes live as CSS variables in globals.css (see src/lib/brand.ts)
      // so a rebrand is a values change there, not a find/replace across pages.
      colors: {
        brand: { 50: "rgb(var(--brand-50) / <alpha-value>)", 100: "rgb(var(--brand-100) / <alpha-value>)", 200: "rgb(var(--brand-200) / <alpha-value>)", 300: "rgb(var(--brand-300) / <alpha-value>)", 400: "rgb(var(--brand-400) / <alpha-value>)", 500: "rgb(var(--brand-500) / <alpha-value>)", 600: "rgb(var(--brand-600) / <alpha-value>)", 700: "rgb(var(--brand-700) / <alpha-value>)", 800: "rgb(var(--brand-800) / <alpha-value>)", 900: "rgb(var(--brand-900) / <alpha-value>)", 950: "rgb(var(--brand-950) / <alpha-value>)" },
        sand: { 50: "rgb(var(--sand-50) / <alpha-value>)", 100: "rgb(var(--sand-100) / <alpha-value>)", 200: "rgb(var(--sand-200) / <alpha-value>)", 300: "rgb(var(--sand-300) / <alpha-value>)", 400: "rgb(var(--sand-400) / <alpha-value>)", 500: "rgb(var(--sand-500) / <alpha-value>)", 600: "rgb(var(--sand-600) / <alpha-value>)", 700: "rgb(var(--sand-700) / <alpha-value>)", 800: "rgb(var(--sand-800) / <alpha-value>)", 900: "rgb(var(--sand-900) / <alpha-value>)", 950: "rgb(var(--sand-950) / <alpha-value>)" },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)"],
        hand: ["var(--font-hand)"],
      },
      // The brand's panels and buttons are square-edged; these keep a hint
      // of softening without reading as "app-rounded".
      borderRadius: {
        lg: "2px",
        xl: "3px",
        "2xl": "4px",
        "3xl": "6px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(28, 25, 23, 0.04), 0 4px 16px rgba(28, 25, 23, 0.06)",
        lift: "0 8px 24px rgba(28, 25, 23, 0.10)",
      },
    },
  },
  plugins: [],
};
export default config;
