import { createTheme } from "@mui/material/styles";

export const COLOURS = {
  "light-divider": "#cccccc",
  "dark-divider": "#3a3d44",
  "bone-white": "#f9f9f9",
  "off-black": "#16181B",
}

export const THEME = createTheme({
  cssVariables: { colorSchemeSelector: "class" }, // adds .light / .dark to <html>
  colorSchemes: {
    light: {
      palette: {
        background: { default: COLOURS["bone-white"], paper: "#ffffff" },
        text: { primary: "#000000" },
        divider: COLOURS["light-divider"],
        primary: { main: "#1976d2" },
        // action:  { active: "#000000" } # I like the default dark grey
      },
    },
    dark: {
      palette: {
        background: { default: COLOURS["off-black"], paper: "#101214" },
        text: { primary: "#F6F7F8" },
        divider: COLOURS["dark-divider"],
        primary: { main: "#7ab8ff" },
        action: { active: "#F6F7F8" },
      },
    },
  },
});
