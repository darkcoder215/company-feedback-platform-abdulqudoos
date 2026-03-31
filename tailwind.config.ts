import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#000000",
          green: "#00C17A",
          "green-light": "#B5E8BE",
          "green-pale": "#B2E2BA",
          blue: "#0072F9",
          red: "#F24935",
          burgundy: "#82003A",
          "hot-pink": "#FF00B7",
          amber: "#FFBC0A",
          "yellow-bright": "#FFDD56",
          "yellow-pale": "#F9E59E",
          peach: "#FF9172",
          salmon: "#FFBAA3",
          blush: "#FFD1C4",
          "pink-light": "#FFA5C6",
          rose: "#FFC9D8",
          lavender: "#D1C4E2",
          "sky-blue": "#84DBE5",
          "sky-light": "#AFE2EA",
          "aqua-pale": "#D1EDEF",
          mint: "#B2E2BA",
        },
        neutral: {
          "dark-slate": "#111421",
          charcoal: "#2B2D3F",
          muted: "#494C6B",
          "warm-gray": "#EFEDE2",
          cream: "#F4F2ED",
          "off-white": "#F7F4EE",
          "warm-white": "#F2EDEA",
        },
        score: {
          excellent: "#00C17A",
          good: "#B2E2BA",
          average: "#FFBC0A",
          below: "#FF9172",
          poor: "#F24935",
        },
      },
      fontFamily: {
        display: ["Thmanyah Serif Display", "Georgia", "serif"],
        body: ["Thmanyah Serif Text", "Georgia", "serif"],
        ui: ["Thmanyah Sans", "Segoe UI", "Helvetica Neue", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        full: "9999px",
      },
      spacing: {
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
        "16": "64px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
        md: "0 4px 12px rgba(0, 0, 0, 0.08)",
        lg: "0 8px 24px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
