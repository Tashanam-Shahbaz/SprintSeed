import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    "./index.html",
    "./src/*/.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#bfe097',           // Button color
        'primary-hover': '#d7e0cd',     // Hover state for button
        'primary-bg': '#ecf2ea',        // Background color
        'secondary-bg': '#f4f7f3',      // Secondary background color
        'text': '#434242',              // Text color
        'complimentary': '#b89d82',     // Complimentary color (TBD)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}

export default config