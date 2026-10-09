"use client";
import { Box, useColorScheme, useMediaQuery } from "@mui/material";
import { formatSA1AreaId, formatVariableStat } from "@/app/utils";
import { namedFlavor } from "@protomaps/basemaps";
import { getMapColours, ColourScale } from "./MapConstants";

const MARKER_RADIUS = 8; // Half of #map-colour-indicator-marker's width (border-box, so includes the border)

type MapColourIndicatorProps = {
    min: number | null;
    max: number | null;
    colourScale: ColourScale | null;
    variableUnit: string | null;
    highlightedValue: number | null;
    showPlusSignForChange: boolean;
};

function MapColourIndicator({
    min,
    max,
    colourScale,
    variableUnit,
    highlightedValue,
    showPlusSignForChange
}:
    MapColourIndicatorProps) {
    const { mode } = useColorScheme();
    if (min === null || max === null || !isFinite(min) || !isFinite(max) || !colourScale) return null;

    const resolvedMode = mode === "dark" ? "dark" : "light";
    const { areaFillOpacity } = getMapColours(resolvedMode);
    const landColour = namedFlavor(resolvedMode).earth;

    // Diverging scales clamp outliers, so draw the bar over the scale's domain rather than the full data range
    // For diverging scales, the domain is set to [-A, 0, A] where A is the maximum absolute value in the data
    // We need to account for this, by only drawing the bar over the overlapping range of teh data and the scale's domain
    const domain = colourScale.domain();
    const domainMin = domain[0];
    const domainMax = domain[domain.length - 1]; // Handles length 2 or 3 cases (sequential and diverging scales)
    const barMin = Math.max(min, domainMin);
    const barMax = Math.min(max, domainMax);
    const minIsClipped = min < domainMin;
    const maxIsClipped = max > domainMax;

    const valueAt = (t: number) => barMin + t * (barMax - barMin);

    const mapLikeColour = (value: number) =>
        `color-mix(in srgb, ${colourScale(value)} ${areaFillOpacity * 100}%, ${landColour})`;

    const stops = Array.from({ length: 10 }, (_, i) => {
        const t = i / 9;
        return `${mapLikeColour(valueAt(t))} ${(t * 100).toFixed(0)}%`;
    }).join(", ");

    const t = highlightedValue != null && barMax !== barMin
        ? (highlightedValue - barMin) / (barMax - barMin)
        : null;

    // Pushes the marker in at the ends, so no part of the circle overhangs the bar
    const markerLeftPosition = t !== null ? `clamp(${MARKER_RADIUS}px, ${t * 100}%, calc(100% - ${MARKER_RADIUS}px))` : undefined;

    const highlightedValuePrefix = (highlightedValue !== null && showPlusSignForChange && highlightedValue > 0) ? "+" : ""
    
    return (
        <Box id="map-colour-indicator-box">
            {t !== null && <Box sx={{ minHeight: "15px" }} />}
            <Box
                sx={{
                    background: `linear-gradient(to right, ${stops})`,
                }}
                id="map-colour-indicator"
            >
                {highlightedValue !== null && (
                    <Box id="map-colour-indicator-marker-container" sx={{ left: markerLeftPosition }}>
                        <Box id="map-colour-indicator-value">
                            {highlightedValuePrefix}{highlightedValue.toLocaleString()}
                        </Box>
                        <Box
                            id="map-colour-indicator-marker"
                            sx={{ backgroundColor: mapLikeColour(highlightedValue) }}
                        />
                    </Box>
                )}
            </Box>
            <Box id="map-info-box-number-indicators">
                <span>{minIsClipped && "≤ "}{formatVariableStat(barMin, variableUnit)}</span>
                <span>{maxIsClipped && "≥ "}{formatVariableStat(barMax, variableUnit)}</span>
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
    colourScale: ColourScale | null;
    hoveredAreaName: string | null;
    hoveredAreaId: string | null;
    hoveredAreaStat: number | null;
    variableUnit: string | null;
    showPlusSignForChange: boolean;
};

export default function MapInfoBox({
    min,
    max,
    colourScale,
    hoveredAreaName,
    hoveredAreaStat,
    variableUnit,
    hoveredAreaId,
    showPlusSignForChange
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
                    <MapColourIndicator
                        min={min}
                        max={max}
                        colourScale={colourScale}
                        variableUnit={variableUnit}
                        highlightedValue={hoveredAreaStat}
                        showPlusSignForChange={showPlusSignForChange}
                    />
                </Box>
            )}
        </>
    );
}