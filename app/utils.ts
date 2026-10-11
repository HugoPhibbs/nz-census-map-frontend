import { useColorScheme } from "@mui/material";
import { MAP_COLOURS_DARK, MAP_COLOURS_LIGHT, MapColours } from "./components/map/MapConstants";

export function roundToDP(value: number, dp: number) {
  const multiplier = Math.pow(10, dp);
  return Math.round(value * multiplier) / multiplier;
}

const VARIABLE_UNIT_TO_DISPLAY_NAME: Record<string, string> = {
    "HOUR": "hrs",
    "YEAR": "yrs",
    "RATE": "p/w",
};

export function formatVariableStat(value: number | null, unit: string | null): string {
    if (value === null || value === undefined) {
        return "";
    }

    if (unit === "COUNT" || !unit) {
      return value.toLocaleString();
    }

    const valueStr = roundToDP(value, 1).toLocaleString();
    
    if (unit === "PERCENTAGE") {
        return `${valueStr}%`;
    }

    if (unit === "HOUR") {
      return valueStr;
    }
    
    if (unit === "NZD") {
        return `$${valueStr}`;
    }

    return `${valueStr} ${VARIABLE_UNIT_TO_DISPLAY_NAME[unit]}`;
}

export function formatSA1AreaId(areaId: string): string {
  return `${areaId} (SA1)`;
}

export const AREA_TYPE_TO_NAME: Record<AREA_TYPE, string> = {
  "ta": "District",
  "sa3": "Subdistrict",
  "sa2": "Suburb",
  "sa1": "Neighbourhood"
}

export type AREA_TYPE = "ta" | "sa3" | "sa2" | "sa1";
export const AREA_TYPES : AREA_TYPE[] = ["ta", "sa3", "sa2", "sa1"];

export const DEFAULT_CENSUS_YEAR = 2023;
export const CENSUS_YEARS = [2023, 2018, 2013];

export function areaIdToAreaType(areaId: string): AREA_TYPE {
    if (areaId.length === 7) {
        return "sa1";
    } else if (areaId.length === 6) {
        return "sa2";
    } else if (areaId.length === 5) {
        return "sa3";
    } else if (areaId.length === 3) {
        return "ta";
    }
    throw new Error(`Cannot determine area type for areaId: ${areaId}`);
}

export function areaIdToAreaTypeName(areaId: string): string {
  const areaType = areaIdToAreaType(areaId);
  return AREA_TYPE_TO_NAME[areaType];
}

/**
 * Get the current colour mode (light or dark) based on the user's website preferences.
 * 
 * Special handling, since we don't account for system colours (yet)
 */
export function useColourMode(): "light" | "dark" {
  const { mode } = useColorScheme();
  return mode === "dark" ? "dark" : "light";
}

export function getMapColours(mode: "light" | "dark"): MapColours {
  return mode === "light" ? MAP_COLOURS_LIGHT : MAP_COLOURS_DARK;
}