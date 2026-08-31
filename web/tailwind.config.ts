import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)", ink2: "var(--ink-2)", ink3: "var(--ink-3)",
        line: "var(--border)", bg: "var(--bg)", lift: "var(--lift)",
        card: "var(--card)", accent: "var(--accent)", accent2: "var(--accent-2)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
