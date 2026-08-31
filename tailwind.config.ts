import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
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
