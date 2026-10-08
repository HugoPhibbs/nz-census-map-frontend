import { describe, test, expect } from "@jest/globals";
import { prepareGroupVariables } from "../app/components/InfoPanel";

const NAMES: Record<string, string> = {
    pct_employed: "Employed",
    median_income: "Median income",
    pct_european: "European",
    pct_maori: "Māori",
    pct_asian: "Asian",
};

const UNITS: Record<string, string> = {
    pct_employed: "PERCENTAGE",
    median_income: "NZD",
    pct_european: "PERCENTAGE",
    pct_maori: "PERCENTAGE",
    pct_asian: "PERCENTAGE",
};

const DEFAULT_YEAR = 2023;

const AVAILABLE_YEARS: Record<string, number[]> = {
    pct_employed: [2013, 2018, 2023],
    median_income: [2013, 2018, 2023],
    pct_european: [2013, 2018, 2023],
    pct_maori: [2013, 2018, 2023],
    pct_asian: [2013, 2018, 2023],
};

const row = (value: number | null) => ({ variable_value: value });

describe("prepareGroupVariables", () => {
    test("returns [id, name, formatted value, avg diff] for each variable", () => {
        const rows = prepareGroupVariables(
            "Employment",
            [["pct_employed"], ["median_income"]],
            { pct_employed: row(62.34), median_income: row(499.94) },
            NAMES,
            UNITS,
            null,
            DEFAULT_YEAR,
            AVAILABLE_YEARS,
        );

        expect(rows).toEqual([
            {id: "pct_employed", name: "Employed", formattedValue: "62.3%", avgDiff: null},
            {id: "median_income", name: "Median income", formattedValue: "$499.9", avgDiff: null},
        ]);
    });

    test("uses the name given in the group over the name map", () => {
        const rows = prepareGroupVariables(
            "Employment",
            [["pct_employed", "Employment rate"]],
            { pct_employed: row(50) },
            NAMES,
            UNITS,
            null,
            DEFAULT_YEAR,
            AVAILABLE_YEARS,
        );

        expect(rows[0].name).toBe("Employment rate");
    });

    test("returns an empty value when the area has no data", () => {
        expect(
            prepareGroupVariables("Employment", [["pct_employed"]], null, NAMES, UNITS, null, DEFAULT_YEAR, AVAILABLE_YEARS),
        ).toEqual([{id: "pct_employed", name: "Employed", formattedValue: "", avgDiff: null}]);

        expect(
            prepareGroupVariables("Employment", [["pct_employed"]], {}, NAMES, UNITS, null, DEFAULT_YEAR, AVAILABLE_YEARS),
        ).toEqual([{id: "pct_employed", name: "Employed", formattedValue: "", avgDiff: null}]);
    });

    test("calculates the difference from the average, rounded to 1dp", () => {
        const rows = prepareGroupVariables(
            "Employment",
            [["pct_employed"]],
            { pct_employed: row(12.34) },
            NAMES,
            UNITS,
            { pct_employed: 10 },
            DEFAULT_YEAR,
            AVAILABLE_YEARS,
        );

        expect(rows[0].avgDiff).toBe(2.3);
    });

    test("gives a negative difference when below average", () => {
        const rows = prepareGroupVariables(
            "Employment",
            [["pct_employed"]],
            { pct_employed: row(40) },
            NAMES,
            UNITS,
            { pct_employed: 55.5 },
            DEFAULT_YEAR,
            AVAILABLE_YEARS,
        );

        expect(rows[0].avgDiff).toBe(-15.5);
    });

    test("leaves the difference null when there is no average for the variable", () => {
        const rows = prepareGroupVariables(
            "Employment",
            [["pct_employed"]],
            { pct_employed: row(40) },
            NAMES,
            UNITS,
            { median_income: 50000 },
            DEFAULT_YEAR,
            AVAILABLE_YEARS,
        );

        expect(rows[0].avgDiff).toBeNull();
    });

    test("sorts Ethnicities by value, highest first", () => {
        const rows = prepareGroupVariables(
            "Ethnicities",
            [["pct_european"], ["pct_maori"], ["pct_asian"]],
            { pct_european: row(10), pct_maori: row(50), pct_asian: row(30) },
            NAMES,
            UNITS,
            null,
            DEFAULT_YEAR,
            AVAILABLE_YEARS,
        );

        expect(rows.map((r) => r.id)).toEqual(["pct_maori", "pct_asian", "pct_european"]);
        expect(rows.map((r) => r.formattedValue)).toEqual(["50%", "30%", "10%"]);
    });

    test("sorts Ethnicities numerically, not alphabetically", () => {
        const rows = prepareGroupVariables(
            "Ethnicities",
            [["pct_european"], ["pct_maori"]],
            { pct_european: row(9), pct_maori: row(10) },
            NAMES,
            UNITS,
            null,
            DEFAULT_YEAR,
            AVAILABLE_YEARS,
        );

        expect(rows.map((r) => r.id)).toEqual(["pct_maori", "pct_european"]);
    });

    test("keeps the given order for other groups", () => {
        const rows = prepareGroupVariables(
            "Employment",
            [["pct_european"], ["pct_maori"], ["pct_asian"]],
            { pct_european: row(10), pct_maori: row(50), pct_asian: row(30) },
            NAMES,
            UNITS,
            null,
            DEFAULT_YEAR,
            AVAILABLE_YEARS,
        );

        expect(rows.map((r) => r.id)).toEqual(["pct_european", "pct_maori", "pct_asian"]);
    });

    test("gives a difference of 0 when the value equals the average", () => {
        const rows = prepareGroupVariables(
            "Employment",
            [["pct_employed"]],
            { pct_employed: row(50) },
            NAMES,
            UNITS,
            { pct_employed: 50 },
            DEFAULT_YEAR,
            AVAILABLE_YEARS,
        );

        expect(rows[0].avgDiff).toBe(0);
    });

    test("gives a difference when the average is 0", () => {
        const rows = prepareGroupVariables(
            "Employment",
            [["pct_employed"]],
            { pct_employed: row(5) },
            NAMES,
            UNITS,
            { pct_employed: 0 },
            DEFAULT_YEAR,
            AVAILABLE_YEARS,
        );

        expect(rows[0].avgDiff).toBe(5);
    });

    test("returns empty diff and value for null values", () => {
        const rows = prepareGroupVariables(
            "Employment",
            [["pct_employed"]],
            { pct_employed: row(null) },
            NAMES,
            UNITS,
            { pct_employed: 0 },
            DEFAULT_YEAR,
            AVAILABLE_YEARS,
        );

        expect(rows[0].formattedValue).toBe("");
        expect(rows[0].avgDiff).toBeNull();
    });

    test("skips variables not available for the chosen census year", () => {
        const rows = prepareGroupVariables(
            "Employment",
            [["pct_employed"], ["median_income"]],
            { pct_employed: row(62.34), median_income: row(499.94) },
            NAMES,
            UNITS,
            null,
            2013,
            { pct_employed: [2013, 2018, 2023], median_income: [2018, 2023] },
        );

        expect(rows.map((r) => r.id)).toEqual(["pct_employed"]);
    });

    test("returns an empty list when no variables are available for the chosen census year", () => {
        const rows = prepareGroupVariables(
            "Employment",
            [["pct_employed"], ["median_income"]],
            { pct_employed: row(62.34), median_income: row(499.94) },
            NAMES,
            UNITS,
            null,
            2013,
            { pct_employed: [2023], median_income: [2018] },
        );

        expect(rows).toEqual([]);
    });

    test("filters by the chosen census year", () => {
        const availableYears = { pct_employed: [2018], median_income: [2023] };
        const groupVariables = [["pct_employed"], ["median_income"]];
        const areaVariables = { pct_employed: row(62.34), median_income: row(499.94) };

        const rows2018 = prepareGroupVariables("Employment", groupVariables, areaVariables, NAMES, UNITS, null, 2018, availableYears);
        const rows2023 = prepareGroupVariables("Employment", groupVariables, areaVariables, NAMES, UNITS, null, 2023, availableYears);

        expect(rows2018.map((r) => r.id)).toEqual(["pct_employed"]);
        expect(rows2023.map((r) => r.id)).toEqual(["median_income"]);
    });
});
