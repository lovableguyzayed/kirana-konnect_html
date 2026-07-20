/** Tailwind config for the static build (npm run build:css).
 *  Unified brand palette: the green scheme used by the majority of pages. */
module.exports = {
  content: ["./templates/**/*.html", "./static/js/**/*.js"],
  theme: {
    extend: {
      colors: {
        primary: "#4CAF50",
        secondary: "#2196F3",
        accent: "#FF9800",
        danger: "#F44336",
        success: "#10b981",
        dark: "#333333",
        light: "#F5F5F5"
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"]
      }
    }
  },
  safelist: [
    // Classes assembled dynamically in JS template literals
    { pattern: /^(bg|text|border)-(red|orange|yellow|green|blue|purple|pink|gray)-(50|100|200|300|400|500|600|700)$/ },
    "bg-primary/10", "bg-secondary/10", "bg-accent/10",
    "bg-purple-600/10", "bg-pink-600/10",
    "text-primary", "text-secondary", "text-accent",
    "border-primary", "border-secondary", "border-accent", "border-danger"
  ],
  plugins: []
};
