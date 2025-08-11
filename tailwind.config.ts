import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: "#FFD600",
          black: "#0A0A0A",
          darkBg: "#0B0B0B",
          card: "#121212",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.20)",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
