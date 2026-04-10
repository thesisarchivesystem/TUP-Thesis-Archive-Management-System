module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: "var(--maroon)",
        terracotta: "var(--terracotta)",
        gold: "var(--gold)",
        sage: "var(--sage)",
        sky: "var(--sky)",
      },
      transitionDuration: {
        "default": "var(--transition-speed, 350ms)",
      },
    },
  },
  plugins: [],
}
