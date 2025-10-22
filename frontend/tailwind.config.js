// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins"],
          colors: {
            slateglass: "rgba(148, 163, 184, 0.15)", // efek abu-abu transparan untuk glassmorphism
          },
      keyframes: {
        glowPulse: {
          "0%, 100%": {
            boxShadow:
              "0 0 20px rgba(148,163,184,0.05), 0 0 40px rgba(148,163,184,0.08)", // abu kehitaman lembut
            transform: "scale(1)",
          },
          "50%": {
            boxShadow:
              "0 0 30px rgba(148,163,184,0.15), 0 0 60px rgba(148,163,184,0.12)",
            transform: "scale(1.03)",
          },
        },
      },
      animation: {
        "glow-green": "glowPulse 4s ease-in-out infinite",
        "glow-yellow": "glowPulse 4s ease-in-out infinite",
        "glow-orange": "glowPulse 4s ease-in-out infinite",
        "glow-red": "glowPulse 4s ease-in-out infinite",
        "glow-purple": "glowPulse 4s ease-in-out infinite",
        "glow-slate": "glowPulse 5s ease-in-out infinite", // tambahan khusus buat tema abu-hitam
      },
      backgroundImage: {
        "slate-gradient":
          "linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)", // gradasi elegan abu kehitaman
      },
    },
  },
},
  plugins: [],
};
