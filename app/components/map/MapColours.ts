import {COLOURS} from "@/app/theme"

export type MapColours = {
  background: string;
  areaFill: string;
  areaBorder: string;
  areaBorderHover: string;
  areaBorderSelected: string;
};


const MAP_COLOURS_LIGHT : MapColours = {
  "background": "#86D7EB",
  "areaFill": "grey",
  "areaBorder": "white",
  "areaBorderHover": COLOURS["off-black"],
  "areaBorderSelected": COLOURS["off-black"],
}

const MAP_COLOURS_DARK : MapColours = {
  "background": "#003852",
  "areaFill": "#363840",
  "areaBorder": COLOURS["off-black"],
  "areaBorderHover": COLOURS["bone-white"],
  "areaBorderSelected": COLOURS["bone-white"],
}

export function getMapColours(mode: "light" | "dark"): MapColours {
  return mode === "light" ? MAP_COLOURS_LIGHT : MAP_COLOURS_DARK;
}