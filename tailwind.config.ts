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
        cricket: {
          pitch: "#15803d",
          grass: "#166534",
          gold: "#eab308",
          crease: "#f8fafc",
          power: "#8b5cf6",
          wicket: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
export default config;
