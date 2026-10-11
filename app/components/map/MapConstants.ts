import { COLOURS } from "@/app/theme";
import { AREA_TYPE, MapColours } from "@/app/types";

export const MAP_COLOURS_LIGHT : MapColours = {
  "background": "#86D7EB",
  "areaFill": "grey",
  "areaBorder": "white",
  "areaBorderHover": COLOURS["off-black"],
  "areaBorderSelected": COLOURS["off-black"],
  "areaFillOpacity": 0.7,
}

export const MAP_COLOURS_DARK : MapColours = {
  "background": "#003852",
  "areaFill": "#363840",
  "areaBorder": COLOURS["off-black"],
  "areaBorderHover": COLOURS["bone-white"],
  "areaBorderSelected": COLOURS["bone-white"],
  "areaFillOpacity": 0.6,
}

export const DEFAULT_CHOSEN_MAP_VARIABLE = "median_age";

export const DEFAULT_ZOOM_RANGES : Record<AREA_TYPE, [number, number]> = {
  "ta": [0, 6],
  "sa3": [6, 9],
  "sa2": [9, 12],
  "sa1": [12, 24],
}