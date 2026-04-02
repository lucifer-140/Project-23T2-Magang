import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-source-sans)', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'serif'],
      },
      colors: {
        uph: {
          blue: '#1a2a4a',
          red: '#b40a1e',
          redHover: '#950818',
          grayBg: '#f7f9fc',
          border: '#dde3ef',
        }
      },
    },
  },
  plugins: [],
};
export default config;
