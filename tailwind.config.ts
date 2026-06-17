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
        surface: "#001234",
        background: "#001234",
        "on-surface": "#d9e2ff",
        "on-surface-variant": "#c5c6d0",
        "on-background": "#d9e2ff",
        primary: "#b2c5fe",
        "primary-container": "#1a2f5e",
        "on-primary-container": "#8598cd",
        tertiary: "#e6c364",
        "tertiary-container": "#c9a84c",
        "on-tertiary": "#3d2e00",
        error: "#ffb4ab",
        outline: "#8f909a",
        "outline-variant": "#44464f",
        "surface-container": "#071e46",
        "surface-container-low": "#021a42",
        "surface-container-lowest": "#000d29",
        "surface-container-high": "#142951",
        "surface-container-highest": "#20345c",
        "surface-variant": "#20345c",
        "primary-fixed-dim": "#b2c5fe",
        card: "#2A3D66",
      },
      spacing: {
        "stack-sm": "12px",
        "stack-md": "24px",
        "stack-lg": "48px",
        gutter: "24px",
        "container-max": "1280px",
        "margin-mobile": "20px",
        "margin-desktop": "64px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        display: ["var(--font-jakarta)", "Plus Jakarta Sans", "sans-serif"],
      },
      fontSize: {
        "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
        "headline-lg": ["32px", { lineHeight: "1.2", fontWeight: "600" }],
        "body-sm": ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
        "label-md": ["12px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }],
        "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
      },
      maxWidth: {
        "container-max": "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
