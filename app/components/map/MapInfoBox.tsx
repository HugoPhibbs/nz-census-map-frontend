"use client";
import { Box } from "@mui/material";
import { roundToDP } from "@/app/utils";
import { interpolatePlasma } from "d3-scale-chromatic";

function MapColourIndicator({ min, max, variableUnit }: { min: number | null; max: number | null; variableUnit: string | null }) {
    if (min === null || max === null || !isFinite(min) || !isFinite(max)) return null;

    const stops = Array.from({ length: 10 }, (_, i) => {
        const t = i / 9;
        return `${interpolatePlasma(t)} ${(t * 100).toFixed(0)}%`;
    }).join(", ");

    return (
        <Box id="map-colour-indicator-box">
            <Box
                sx={{
                    background: `linear-gradient(to right, ${stops})`,
                }}
                id="map-colour-indicator"
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 12, mt: 0.5 }}>
                <span>{formatVariableStat(min, variableUnit)}</span>
                <span>{formatVariableStat(max, variableUnit)}</span>
            </Box>
        </Box>
    );
}

function formatVariableStat(value: number | null, unit: string | null): string {
    const VARIABLE_UNIT_TO_DISPLAY_NAME: Record<string, string> = {
        "HOUR": "hrs",
        "COUNT": "people",
        "NZD": "$",
        "YEAR": "yrs",
        "RATE": "p/w",
        "PERCENTAGE": "%"
    };

    if (value === null || unit === null) {
        return "";
    }
    value = roundToDP(value, 2);

    if (unit == "NZD") {
        return `$${value}`;
    }

    if (unit == "PERCENTAGE") {
        return `${value}%`;
    }

    // if (unit == "COUNT") {
    //   return value.toString();
    // }

    console.assert(unit in VARIABLE_UNIT_TO_DISPLAY_NAME, `Unknown unit: ${unit}`);

    return `${value} ${VARIABLE_UNIT_TO_DISPLAY_NAME[unit]}`;
}

function HoverInfoBox({ hoveredAreaName, hoveredAreaStat, variableUnit }: { hoveredAreaName: string | null; hoveredAreaId: string | null; hoveredAreaStat: number | null; variableUnit: string | null }) {
    const showNameOnly = hoveredAreaName && !hoveredAreaStat;
    const showNameAndStat = hoveredAreaName && hoveredAreaStat;

    return (
        <Box id={"hover-info-box"}>
            {showNameOnly && <p>{hoveredAreaName}</p>}
            {showNameAndStat && <p>{hoveredAreaName}: {formatVariableStat(hoveredAreaStat, variableUnit)}</p>}
        </Box>
    );
}

type MapInfoBoxProps = {
    min: number | null;
    max: number | null;
    hoveredAreaName: string | null;
    hoveredAreaId: string | null;
    hoveredAreaStat: number | null;
    variableUnit: string | null;
};

export default function MapInfoBox({
    min,
    max,
    hoveredAreaName,
    hoveredAreaStat,
    variableUnit,
    hoveredAreaId,
}: MapInfoBoxProps) {
    return (
        <>
            {(hoveredAreaName || (min && max)) &&
                <Box id={"map-info-box"} sx={{ zIndex: 1 }}>
                    <HoverInfoBox
                        hoveredAreaName={hoveredAreaName}
                        hoveredAreaStat={hoveredAreaStat}
                        variableUnit={variableUnit}
                        hoveredAreaId={hoveredAreaId}
                    />
                    <MapColourIndicator min={min} max={max} variableUnit={variableUnit} />
                </Box>}
        </>
    );
}