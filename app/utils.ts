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
    if (!value) {
        return "";
    }

    if (typeof value === "string" || unit === "COUNT" || !unit) {
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

    return `${value} ${VARIABLE_UNIT_TO_DISPLAY_NAME[unit]}`;
}

export function formatSA1Code(areaCode: string): string {
  return `${areaCode} (SA1)`;
}