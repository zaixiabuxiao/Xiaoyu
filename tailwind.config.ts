import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FBF3E2",
        navy: "#1B2A4E",
        "warm-orange": "#E8743B",
        "warm-orange-soft": "#F2A472",
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", '"Press Start 2P"', "monospace"],
        body: ["var(--font-body)", '"VT323"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        pixel: "4px 4px 0 0 #1B2A4E",
        "pixel-sm": "2px 2px 0 0 #1B2A4E",
        "pixel-orange": "4px 4px 0 0 #E8743B",
      },
      borderWidth: {
        "3": "3px",
      },
    },
  },
  plugins: [],
};

export default config;
