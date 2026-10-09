"use client";
import { Box, useColorScheme, useMediaQuery } from "@mui/material";
import { formatSA1AreaId, formatVariableStat } from "@/app/utils";
import { interpolatePlasma } from "d3-scale-chromatic";
import { namedFlavor } from "@protomaps/basemaps";
import { getMapColours } from "./MapConstants";

const MARKER_RADIUS = 8; // Half of #map-colour-indicator-marker's width (border-box, so includes the border)

function MapColourIndicator({ min, max, variableUnit, highlightedValue }: { min: number | null; max: number | null; variableUnit: string | null; highlightedValue: number | null }) {
    if (min === null || max === null || !isFinite(min) || !isFinite(max)) return null;

    const { mode } = useColorScheme();
    const resolvedMode = mode === "dark" ? "dark" : "light";
    const { areaFillOpacity } = getMapColours(resolvedMode);
    const landColour = namedFlavor(resolvedMode).earth;

    const mapLikeColour = (t: number) =>
        `color-mix(in srgb, ${interpolatePlasma(t)} ${areaFillOpacity * 100}%, ${landColour})`;

    const stops = Array.from({ length: 10 }, (_, i) => {
        const t = i / 9;
        return `${mapLikeColour(t)} ${(t * 100).toFixed(0)}%`;
    }).join(", ");

    const t = highlightedValue != null && max !== min
        ? (highlightedValue - min) / (max - min)
        : null;

    // Pushes the marker in at the ends, so no part of the circle overhangs the bar
    const markerLeftPosition = t !== null ? `clamp(${MARKER_RADIUS}px, ${t * 100}%, calc(100% - ${MARKER_RADIUS}px))` : undefined;

    return (
        <Box id="map-colour-indicator-box">
            {t !== null && <Box sx={{minHeight: "15px"}}/>}
            <Box
                sx={{
                    background: `linear-gradient(to right, ${stops})`,
                }}
                id="map-colour-indicator"
            >
                {t !== null && (
                    <Box id="map-colour-indicator-marker-container" sx={{ left: markerLeftPosition }}>
                        <Box id="map-colour-indicator-value">
                            {highlightedValue?.toLocaleString()}
                        </Box>
                        <Box
                            id="map-colour-indicator-marker"
                            sx={{ backgroundColor: mapLikeColour(t) }}
                        />
                    </Box>
                )}
            </Box>
            <Box id="map-info-box-number-indicators">
                <span>{formatVariableStat(min, variableUnit)}</span>
                <span>{formatVariableStat(max, variableUnit)}</span>
            </Box>
        </Box>
    );
}

function HoverInfoBox({ hoveredAreaName, hoveredAreaId, isPhone }: { hoveredAreaName: string | null; hoveredAreaId: string | null; isPhone: boolean }) {
    if (!hoveredAreaId || isPhone) return null;

    return (
        <Box id={"hover-info-box"}>
            {hoveredAreaName || formatSA1AreaId(hoveredAreaId)}
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
    const minMaxDefined = min !== null && max !== null;

    if (isPhone && !minMaxDefined) {
        return null;
    }

    return (
        <>
            {(hoveredAreaId || (minMaxDefined)) && (
                <Box id={"map-info-box"}>
                    <HoverInfoBox
                        hoveredAreaName={hoveredAreaName}
                        hoveredAreaId={hoveredAreaId}
                        isPhone={isPhone}
                    />
                    <MapColourIndicator min={min} max={max} variableUnit={variableUnit} highlightedValue={hoveredAreaStat} />
                </Box>
            )}
        </>
    );
}