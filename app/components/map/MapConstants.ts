import {COLOURS} from "@/app/theme"
import { AREA_TYPE } from "@/app/utils";
import { ScaleDiverging, ScaleSequential } from "d3-scale";

export type MapColours = {
  background: string;
  areaFill: string;
  areaBorder: string;
  areaBorderHover: string;
  areaBorderSelected: string;
  areaFillOpacity: number;
};

export type ColourScale = ScaleDiverging<string> | ScaleSequential<string>;


const MAP_COLOURS_LIGHT : MapColours = {
  "background": "#86D7EB",
  "areaFill": "grey",
  "areaBorder": "white",
  "areaBorderHover": COLOURS["off-black"],
  "areaBorderSelected": COLOURS["off-black"],
  "areaFillOpacity": 0.7,
}

const MAP_COLOURS_DARK : MapColours = {
  "background": "#003852",
  "areaFill": "#363840",
  "areaBorder": COLOURS["off-black"],
  "areaBorderHover": COLOURS["bone-white"],
  "areaBorderSelected": COLOURS["bone-white"],
  "areaFillOpacity": 0.6,
}

export function getMapColours(mode: "light" | "dark"): MapColours {
  return mode === "light" ? MAP_COLOURS_LIGHT : MAP_COLOURS_DARK;
}

export const DEFAULT_CHOSEN_MAP_VARIABLE = "median_age";

export const DEFAULT_ZOOM_RANGES : Record<AREA_TYPE, [number, number]> = {
  "ta": [0, 6],
  "sa3": [6, 9],
  "sa2": [9, 12],
  "sa1": [12, 24],
}

