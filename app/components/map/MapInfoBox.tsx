"use client";
import { Box, useMediaQuery } from "@mui/material";
import { formatSA1Code, formatVariableStat } from "@/app/utils";
import { interpolatePlasma } from "d3-scale-chromatic";

const withOpacity = (c: string) => `color-mix(in srgb, ${c} 80%, transparent)`;

function MapColourIndicator({ min, max, variableUnit, highlightedValue }: { min: number | null; max: number | null; variableUnit: string | null; highlightedValue: number | null }) {
    if (min === null || max === null || !isFinite(min) || !isFinite(max)) return null;

    const stops = Array.from({ length: 10 }, (_, i) => {
        const t = i / 9;
        return `${withOpacity(interpolatePlasma(t))} ${(t * 100).toFixed(0)}%`;
    }).join(", ");

    const t = highlightedValue != null ? (highlightedValue - min) / (max - min) : null;

    return (
        <Box id="map-colour-indicator-box">
            <Box
                sx={{
                    background: `linear-gradient(to right, ${stops})`,
                }}
                id="map-colour-indicator"
            >
                {t !== null && (
                    <>
                        <Box id="map-colour-indicator-value" sx={{ left: `${t * 100}%` }}>
                            {highlightedValue}
                        </Box>
                        <Box    
                            id="map-colour-indicator-marker"
                            sx={{ left: `${t * 100}%`}}
                        />
                    </>
                )}
            </Box>
            <Box id="map-info-box-number-indicators">
                <span>{formatVariableStat(min, variableUnit)}</span>
                <span>{formatVariableStat(max, variableUnit)}</span>
            </Box>
        </Box>
    );
}

function HoverInfoBox({ hoveredAreaName, hoveredAreaId }: { hoveredAreaName: string | null; hoveredAreaId: string | null }) {
    if (!hoveredAreaId) return null;

    return (
        <Box id={"hover-info-box"}>
            {hoveredAreaName || formatSA1Code(hoveredAreaId.split("-")[1])}
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
    const isPhone = useMediaQuery("(max-width: 600px)");

    if (isPhone && !(min && max)) {
        return null;
    }

    return (
        <>
            {(hoveredAreaId || (min && max)) && (
                <Box id={"map-info-box"}>
                    <HoverInfoBox
                        hoveredAreaName={hoveredAreaName}
                        hoveredAreaId={hoveredAreaId}
                    />
                    <MapColourIndicator min={min} max={max} variableUnit={variableUnit} highlightedValue={hoveredAreaStat} />
                </Box>
            )}
        </>
    );
}