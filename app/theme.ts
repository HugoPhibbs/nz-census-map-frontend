"use client";
import { createTheme } from "@mui/material/styles";

export const COLOURS = {
  "light-divider": "#cccccc",
  "dark-divider": "#3a3d44",
  "bone-white": "#f9f9f9",
  "off-black": "#16181B",
}

export const THEME = createTheme({
  cssVariables: { colorSchemeSelector: "class" }, // adds .light / .dark classes to <html>
  colorSchemes: {
    light: {
      palette: {
        background: { default: COLOURS["bone-white"], paper: "#ffffff" },
        text: { primary: "#000000", secondary: "#727272" },
        divider: COLOURS["light-divider"],
        primary: { main: "#1976d2" },
        // # I like the default dark grey for action, so we don't set
      },
    },
    dark: {
      palette: {
        background: { default: "#101214", paper: COLOURS["off-black"]},
        text: { primary: "#F6F7F8", secondary: "#c2c2c2" }, // TODO set secondary to something better for dark mode (say a darker grey)
        divider: COLOURS["dark-divider"],
        primary: { main: "#7ab8ff" },
        action: { active: "#F6F7F8" },
      },
    },
  },
});
