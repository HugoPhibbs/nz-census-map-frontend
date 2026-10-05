import { roundToDP, formatVariableStat, formatSA1Code } from "../app/utils";
import { describe, test, expect } from "@jest/globals";

describe("roundToDP", () => {
  test("rounds to the given number of decimal places", () => {
    expect(roundToDP(1.234, 2)).toBe(1.23);
    expect(roundToDP(1.25, 1)).toBe(1.3);
  });

  test("rounds to an integer when dp is 0", () => {
    expect(roundToDP(4.6, 0)).toBe(5);
  });
});

describe("formatVariableStat", () => {
  test("returns an empty string for null", () => {
    expect(formatVariableStat(null, "COUNT")).toBe("");
  });

  test("leaves strings, counts and unitless values unrounded", () => {
    expect(formatVariableStat(42, "COUNT")).toBe("42");
    expect(formatVariableStat(42.567, null)).toBe("42.567");
  });

  test("formats percentages to 1dp with a % suffix", () => {
    expect(formatVariableStat(12.34, "PERCENTAGE")).toBe("12.3%");
  });

  test("formats hours to 1dp without a suffix", () => {
    expect(formatVariableStat(7.24, "HOUR")).toBe("7.2");
  });

  test("formats NZD to 1dp with a $ prefix", () => {
    expect(formatVariableStat(499.94, "NZD")).toBe("$499.9");
  });

  test("appends the display name for other units", () => {
    expect(formatVariableStat(35, "YEAR")).toBe("35 yrs");
    expect(formatVariableStat(42.5, "RATE")).toBe("42.5 p/w");
  });

  test("formats zero rather than returning an empty string", () => {
    expect(formatVariableStat(0, "PERCENTAGE")).toBe("0%");
  });

  test("rounds YEAR/RATE values to 1dp", () => {
    expect(formatVariableStat(35.678, "YEAR")).toBe("35.7 yrs");
  });
});

describe("formatSA1Code", () => {
  test("appends the SA1 label", () => {
    expect(formatSA1Code("7000001")).toBe("7000001 (SA1)");
  });
});
