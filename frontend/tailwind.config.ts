import type { Config } from "tailwindcss";

const v = (n: string) => `rgb(var(--${n}) / <alpha-value>)`;
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"), panel: v("panel"), card: v("card"), hover: v("hover"), line: v("line"),
        ink: v("ink"), mute: v("mute"), accent: v("accent"), "accent-ink": v("accent-ink"),
        banner: v("banner"), good: v("good"),
      },
      fontFamily: { sans: ["'DM Sans'", "Inter", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"] },
      boxShadow: { pop: "0 12px 40px -8px rgb(0 0 0 / 0.45)" },
    },
  },
  plugins: [],
};
export default config;
