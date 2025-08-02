import daisyui from "daisyui";
import typography from "@tailwindcss/typography";

// Global font size configuration - Change this one value to scale all text
const BASE_REM_SIZE = 20; // Default is 16px, set to 18px for larger text

// Calculate font sizes based on the base rem size
const calculateFontSize = (remValue) => {
  const pixels = remValue * BASE_REM_SIZE;
  return [`${pixels}px`, { lineHeight: `${pixels * 1.5}px` }];
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
      fontSize: {
        'xs': calculateFontSize(0.75),    // 0.75 * 18px = 13.5px
        'sm': calculateFontSize(0.875),   // 0.875 * 18px = 15.75px
        'base': calculateFontSize(1),     // 1 * 18px = 18px
        'lg': calculateFontSize(1.125),   // 1.125 * 18px = 20.25px
        'xl': calculateFontSize(1.25),    // 1.25 * 18px = 22.5px
        '2xl': calculateFontSize(1.5),    // 1.5 * 18px = 27px
        '3xl': calculateFontSize(1.875),  // 1.875 * 18px = 33.75px
        '4xl': calculateFontSize(2.25),   // 2.25 * 18px = 40.5px
        '5xl': calculateFontSize(3),      // 3 * 18px = 54px
        '6xl': calculateFontSize(3.75),   // 3.75 * 18px = 67.5px
      },
  },
  plugins: [typography, daisyui],
};
