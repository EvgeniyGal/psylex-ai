import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#070f2b",
        card: "#0f1a3f",
        accent: "#f3c969",
        text: "#f5f7ff",
        muted: "#9fb0d9",
      },
    },
  },
  plugins: [],
};

export default config;
