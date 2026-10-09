/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#090B10",
        panel: {
          DEFAULT: "#0F131D",
          lighter: "#161C2A",
          active: "#1C2436",
        },
        border: {
          subtle: "#1F2639",
          hover: "#2F3A56",
        },
        accent: {
          cyan: "#00F0FF",
          amber: "#F59E0B",
          crimson: "#EF4444",
          emerald: "#10B981",
          purple: "#A855F7",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "shockwave": "shockwave 1.5s cubic-bezier(0, 0.2, 0.8, 1) infinite",
      },
      keyframes: {
        shockwave: {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
