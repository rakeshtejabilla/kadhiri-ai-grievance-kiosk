/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: "#0B2E59",
          blue: "#154C9B",
          blueLight: "#E8F1FC",
          skyLight: "#DCEBFB",
          accent: "#1E63C7",
          success: "#1E9E5A",
          successLight: "#E5F7ED",
          danger: "#E2601E",
          dangerLight: "#FCEBDF",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "Segoe UI",
          "Noto Sans",
          "system-ui",
          "sans-serif",
        ],
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        waveform: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        pulseRing: "pulseRing 1.8s ease-out infinite",
        waveform: "waveform 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
