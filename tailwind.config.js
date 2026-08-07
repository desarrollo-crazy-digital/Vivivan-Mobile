/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: NativeWind version 4 requires "presets" or direct config.
  // In v4, we can define content files where components are.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F172A", // Slate-900 for dark corporate header
          light: "#1E293B",   // Slate-800
          blue: "#3B82F6",    // Blue-500 matching web branding
        },
        background: {
          DEFAULT: "#F8FAFC", // Slate-50 soft bg
          card: "#FFFFFF",
        },
        status: {
          borrador: "#FBBF24",   // Amber-400
          activado: "#10B981",   // Emerald-500
          ko: "#EF4444",         // Red-500
          baja: "#64748B",       // Slate-500
        }
      }
    },
  },
  plugins: [],
}
