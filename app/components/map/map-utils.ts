import { COLOURS } from "@/app/theme";
import { AREA_TYPE, MapColours } from "@/app/types";

export const MAP_COLOURS_LIGHT : MapColours = {
  "background": "#86D7EB",
  "areaFill": "grey",
  "areaBorder": "white",
  "areaBorderHover": COLOURS["dark-divider"], // COLOURS["off-black"]
  "areaBorderSelected": COLOURS["off-black"],
  "areaFillOpacity": 0.7,
  "labelColour": COLOURS["off-black"],
}

export const MAP_COLOURS_DARK : MapColours = {
  "background": "#003852",
  "areaFill": "#363840",
  "areaBorder": COLOURS["off-black"],
  "areaBorderHover": COLOURS["light-divider"], // COLOURS["bone-white"]
  "areaBorderSelected": COLOURS["bone-white"],
  "areaFillOpacity": 0.6,
  "labelColour": COLOURS["bone-white"],
}

export const DEFAULT_CHOSEN_MAP_VARIABLE = "median_age";

export const DEFAULT_ZOOM_RANGES : Record<AREA_TYPE, [number, number]> = {
  "ta": [0, 6],
  "sa3": [6, 9],
  "sa2": [9, 12],
  "sa1": [12, 24],
}

export const BASEMAP_SOURCE_ID = "basemap";

export const areaSourceId = (areaType: AREA_TYPE) => `boundaries-${areaType}`;

/**
 * Returns the URL for a PMTiles source file stored in the GCP bucket.
 * 
 * @param filename The name of the PMTiles file (without the .pmtiles extension).
 * @returns The full URL to the PMTiles source file
 */
export const pmtilesSourceUrl = (filename: string) => `pmtiles://${process.env.NEXT_PUBLIC_GCP_BUCKET_URL}/${filename}.pmtiles`;