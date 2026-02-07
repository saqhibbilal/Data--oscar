/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        quantico: ["Quantico", "monospace"],
      },
      colors: {
        surface: {
          900: "#0a0a0b",
          800: "#111113",
          700: "#18181b",
          600: "#1f1f23",
          500: "#27272a",
        },
        accent: {
          DEFAULT: "#22d3ee",
          dim: "#0891b2",
        },
        border: {
          DEFAULT: "#27272a",
          bright: "#3f3f46",
        },
      },
      borderWidth: {
        1: "1px",
      },
      boxShadow: {
        sharp: "0 0 0 1px rgba(255,255,255,0.06)",
        glow: "0 0 20px -5px rgba(34, 211, 238, 0.25)",
      },
    },
  },
  plugins: [],
};
