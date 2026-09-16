"use client";
import { Box } from "@mui/material";
import { formatSA1Code, formatVariableStat } from "@/app/utils";
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
            <Box id="map-info-box-number-indicators">
                <span>{formatVariableStat(min, variableUnit)}</span>
                <span>{formatVariableStat(max, variableUnit)}</span>
            </Box>
        </Box>
    );
}

function HoverInfoBox({ hoveredAreaName, hoveredAreaStat, variableUnit, hoveredAreaId }: { hoveredAreaName: string | null; hoveredAreaId: string | null; hoveredAreaStat: number | null; variableUnit: string | null }) {
    if (!hoveredAreaId) return null; // Nothing being hovered

    let label = hoveredAreaName;
    if (!label) {
        label = formatSA1Code(hoveredAreaId.split("-")[1]); // Fallback to ID (for SA1s, which don't have names)
    }

    return (
        <Box id={"hover-info-box"}>
            {!!hoveredAreaStat ? <p>{label}: {formatVariableStat(hoveredAreaStat, variableUnit)}</p> : <p>{label}</p>}
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
            {(hoveredAreaId || (min && max)) &&
                <Box id={"map-info-box"}>
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