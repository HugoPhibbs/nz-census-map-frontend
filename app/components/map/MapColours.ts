import {COLOURS} from "../../theme"

export type MapColours = {
  background: string;
  areaFill: string;
  areaBorder: string;
  areaBorderHover: string;
  areaBorderSelected: string;
  // areaFillOpacity: number;
};


const MAP_COLOURS_LIGHT : MapColours = {
  "background": "#86D7EB",
  "areaFill": "grey",
  "areaBorder": "white",
  "areaBorderHover": COLOURS["off-black"],
  "areaBorderSelected": COLOURS["off-black"],
  // "areaFillOpacity": 0.6
}

const MAP_COLOURS_DARK : MapColours = {
  "background": "#003852",
  "areaFill": "#363840",
  "areaBorder": COLOURS["off-black"],
  "areaBorderHover": COLOURS["bone-white"],
  "areaBorderSelected": COLOURS["bone-white"],
  // "areaFillOpacity": 0.8
}

export function getMapColours(mode: "light" | "dark"): MapColours {
  return mode === "light" ? MAP_COLOURS_LIGHT : MAP_COLOURS_DARK;
}