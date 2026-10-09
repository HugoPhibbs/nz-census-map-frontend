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

export function areaIdToAreaType(areaId: string | null): AREA_TYPE | null {
    if (!areaId) return null;
    if (areaId.length === 7) {
        return "sa1";
    } else if (areaId.length === 6) {
        return "sa2";
    } else if (areaId.length === 5) {
        return "sa3";
    } else if (areaId.length === 3) {
        return "ta";
    }
    return null;
}

export function areaIdToAreaTypeName(areaId: string | null): string | null {
  const areaType = areaIdToAreaType(areaId);
  if (!areaType) return null;
  return AREA_TYPE_TO_NAME[areaType];
}