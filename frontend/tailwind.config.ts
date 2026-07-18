import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        sans: ["SF Pro Display", "Geist Sans", "Helvetica Neue", "system-ui", "sans-serif"]
      },
      colors: {
        paper: "#FFFFFF",
        warm: "#F7F6F3",
        ink: "#111111",
        muted: "#787774",
        border: "#EAEAEA",
        pastel: {
          red: { bg: "#FDEBEC", text: "#9F2F2D" },
          blue: { bg: "#E1F3FE", text: "#1F6C9F" },
          green: { bg: "#EDF3EC", text: "#346538" },
          yellow: { bg: "#FBF3DB", text: "#956400" }
        }
      },
      boxShadow: {
        card: "0 1px 4px rgba(0,0,0,0.04)",
        hover: "0 2px 8px rgba(0,0,0,0.06)"
      }
    }
  },
  plugins: []
};

export default config;
