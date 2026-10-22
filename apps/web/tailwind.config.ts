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
        echo: {
          dark: "#0A0A0A",      // Hovedbakgrunn
          surface: "#121212",   // Kort og paneler
          border: "#262626",    // Subtile skillelinjer for layout
          cyan: "#00F0FF",      // Subtil neon-aksent for primær CTA
          purple: "#8A2BE2",    // Sekundær aksent for metadata/PoE
          muted: "#888888",     // For sekundær monospace data
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"], // Streng bruk for data
      },
      backdropBlur: {
        glass: "12px", // Standardverdi for liquid glass overlays
      },
    },
  },
  plugins: [],
};

export default config;
