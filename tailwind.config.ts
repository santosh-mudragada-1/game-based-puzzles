import type { Config } from "tailwindcss";

/**
 * Chess.com dark-theme design tokens.
 * Values were sampled from the reference home-page screenshots so the
 * Blind Spot Trainer blends into Chess.com's ecosystem.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces (warm near-black charcoals)
        bg: "#302e2b", // app background
        surface: {
          DEFAULT: "#262522", // cards & panels (Game History, rail, hero container)
          raised: "#353331", // lighter inner cards (hero preview cards)
          hover: "#3b3937", // card hover
          sunken: "#1f1e1c", // header strips / wells
          rail: "#272522", // sidebar / right rail
        },
        line: {
          DEFAULT: "#3d3a37", // hairline borders
          soft: "#34322f",
        },
        // Text
        ink: {
          DEFAULT: "#ffffff",
          muted: "#b7b4b0",
          // Raised to clear WCAG AA (4.5:1) for small text on bg/surface.
          soft: "#a3a19e",
          faint: "#9e9c99",
        },
        // Brand green (Chess.com)
        brand: {
          DEFAULT: "#81b64c",
          hover: "#8ec155",
          press: "#6c9e3f",
          edge: "#4c7a2f", // 3D bottom edge
          soft: "#5d8038",
          ink: "#e8f3da",
        },
        // Accent hues
        info: "#4a90d9", // upgrade / lessons blue
        gold: "#e6912c", // puzzles / streak
        flame: "#f0810f",
        // Board
        board: {
          light: "#eeeed2",
          dark: "#769656",
          highlight: "#f6f669", // moved/selected square
          hint: "#fbcf4d",
        },
        // Move classification (aligned to /public/move-types art)
        move: {
          brilliant: "#26c2a3",
          great: "#5c8bb0",
          best: "#81b64c",
          excellent: "#95b776",
          good: "#a8a89a",
          book: "#a88865",
          inaccuracy: "#f0c15c",
          mistake: "#e58f2a",
          missed: "#e0a03c",
          blunder: "#ca3431",
        },
        // Result badges
        win: "#7fa650",
        loss: "#c4453f",
        draw: "#8b8987",
      },
      fontFamily: {
        // "Chess Sans" is proprietary; falls back to Inter until a licensed
        // font file is dropped into /public/fonts (see layout.tsx).
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: [
          "var(--font-chess-sans)",
          "var(--font-inter)",
          "system-ui",
          "sans-serif",
        ],
        // Figurine notation — see the @font-face in globals.css.
        chess: ["Chess", "serif"],
      },
      borderRadius: {
        card: "8px",
        control: "6px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.28)",
        raised: "0 8px 24px -8px rgba(0,0,0,0.55)",
        pop: "0 12px 32px -10px rgba(0,0,0,0.6)",
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      transitionTimingFunction: {
        "out-quint": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        // The mated king's square, breathing red rather than flashing.
        "loss-pulse": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.85" },
        },
        // The mated king takes the blow once, then settles.
        "king-topple": {
          "0%": { transform: "rotate(0deg)" },
          "22%": { transform: "rotate(-9deg)" },
          "44%": { transform: "rotate(6deg)" },
          "66%": { transform: "rotate(-3.5deg)" },
          "84%": { transform: "rotate(1.5deg)" },
          "100%": { transform: "rotate(0deg)" },
        },
        "badge-pop": {
          from: { opacity: "0", transform: "scale(0.4)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 1.6s infinite",
        "loss-pulse": "loss-pulse 1.9s ease-in-out infinite",
        "king-topple":
          "king-topple 0.75s cubic-bezier(0.36,0.07,0.19,0.97) 0.15s 1 both",
        "badge-pop": "badge-pop 0.3s cubic-bezier(0.22,1,0.36,1) 0.35s both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
