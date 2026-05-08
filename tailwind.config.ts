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
        "diary-cream": "#FDF3D8",
        "diary-cream-1": "#FBE8C4",
        "diary-cream-2": "#F5DBA6",
        "diary-cream-3": "#ECC983",
        "diary-orange-d": "#C66A2F",
        "diary-orange-l": "#F3B06F",
        "diary-ink-soft": "#5B6A89",
        heart: "#EE6F7E",
        "heart-d": "#D04A5B",
        gold: "#F0C451",
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", '"Press Start 2P"', "monospace"],
        body: ["var(--font-body)", '"VT323"', "ui-monospace", "monospace"],
        display: [
          "var(--font-display)",
          '"ZCOOL KuaiLe"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          "sans-serif",
        ],
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
