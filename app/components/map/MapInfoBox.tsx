"use client";
import { Box, Collapse, Divider, useMediaQuery } from "@mui/material";
import { formatSA1AreaId, roundToDP } from "@/app/utils";
import { namedFlavor } from "@protomaps/basemaps";
import { ColourScale } from "@/app/types";
import { getMapColours, useColourMode } from "@/app/utils";
import { useRef } from "react";

const MARKER_RADIUS = 8; // Half of #map-colour-indicator-marker's width (border-box, so includes the border)

type MapColourIndicatorProps = {
    min: number | null;
    max: number | null;
    colourScale: ColourScale | null;
    highlightedValue: number | null;
    showPlusSignForChange: boolean;
    hoveredAreaId: string | null;
};

/**
 * 
 * Gets how a colour would typically look like on the map accounting for the earth colour and the fill opacity
 * 
 * @param colour colour string (e.g. "#8f0da4") or RGB ("rgb(162, 215, 158)")
 * @param colourMode "light" or "dark"
 * @returns 
 */
function mapLikeColour(colour: string, colourMode: "light" | "dark") {
    const { areaFillOpacity } = getMapColours(colourMode);
    const landColour = namedFlavor(colourMode).earth;
    return `color-mix(in srgb, ${colour} ${areaFillOpacity * 100}%, ${landColour})`;
}


function MapColourIndicator({
    min,
    max,
    colourScale,
    highlightedValue,
    showPlusSignForChange,
    hoveredAreaId
}:
    MapColourIndicatorProps) {

    const colourMode = useColourMode();

    if (min === null || max === null || !isFinite(min) || !isFinite(max) || !colourScale) return null;

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

    const stops = Array.from({ length: 10 }, (_, i) => {
        const t = i / 9;
        return `${mapLikeColour(colourScale(valueAt(t)), colourMode)} ${(t * 100).toFixed(0)}%`;
    }).join(", ");

    const t = highlightedValue != null && barMax !== barMin
        ? (highlightedValue - barMin) / (barMax - barMin)
        : null;

    // Pushes the marker in at the ends, so no part of the circle overhangs the bar
    const markerLeftPosition = t !== null ? `clamp(${MARKER_RADIUS}px, ${t * 100}%, calc(100% - ${MARKER_RADIUS}px))` : undefined;

    const highlightedValuePrefix = (highlightedValue !== null && showPlusSignForChange && highlightedValue > 0) ? "+" : ""

    const emptyDataColour = mapLikeColour(getMapColours(colourMode).areaFill, colourMode);

    return (
        // Add margin to the top to clear space for the hover text
        <Box id="map-colour-indicator-box" sx={{ marginTop: highlightedValue !== null ? "15px" : 0 }}>
            <Box id="map-colour-indicator-bar-container">
                <Box
                    sx={{
                        background: `linear-gradient(to right, ${stops})`,
                    }}
                    id="map-colour-indicator-bar"
                >
                    {highlightedValue !== null && (
                        <Box id="map-colour-indicator-marker-container" sx={{ left: markerLeftPosition }}>
                            <Box id="map-colour-indicator-value">
                                {highlightedValuePrefix}{roundToDP(highlightedValue, 1).toLocaleString()}
                            </Box>
                            <Box
                                className="map-colour-indicator-marker"
                                sx={{ backgroundColor: mapLikeColour(colourScale(highlightedValue), colourMode) }}
                            />
                        </Box>
                    )}
                </Box>

                <Box id="map-info-box-number-indicators">
                    <Box>{minIsClipped && "≤ "}{roundToDP(barMin, 1).toLocaleString()}</Box>
                    <Box>{maxIsClipped && "≥ "}{roundToDP(barMax, 1).toLocaleString()}</Box>
                </Box>
            </Box>

            <Divider orientation="vertical" flexItem />

            <Box id="map-info-box-empty-data-indicator-box">
                <Box id="map-info-box-empty-indicator-slot">
                    {(hoveredAreaId && highlightedValue == null) ?
                        <Box className="map-colour-indicator-marker"
                            sx={{ backgroundColor: emptyDataColour }}
                        /> :
                        <Box id="empty-data-indicator"
                            sx={{
                                backgroundColor: emptyDataColour,
                                border: colourMode == "dark" ? "0.7px solid white" : "none"
                            }}
                        />
                    }
                </Box>
                <Box>N/A</Box>
            </Box>
        </Box>
    );
}

type HoverInfoBoxProps = {
    hoveredAreaName: string | null;
    hoveredAreaId: string | null;
    isPhone: boolean;
    hoveredAreaStat: number | null;
};

function HoverInfoBox({
    hoveredAreaName,
    hoveredAreaId,
    isPhone,
    hoveredAreaStat }:
    HoverInfoBoxProps
) {
    // Keep the last label, so it transitions down with the label (instead of being empty)
    const lastLabel = useRef<string | null>(null);
    if (hoveredAreaId) lastLabel.current = hoveredAreaName || formatSA1AreaId(hoveredAreaId);

    if (isPhone) return null;

    return (
        <Collapse in={!!hoveredAreaId} timeout={300}>
            <Box id={"hover-info-box"}>
                {lastLabel.current}
            </Box>
        </Collapse>
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
                        hoveredAreaStat={hoveredAreaStat}
                    />
                    <MapColourIndicator
                        min={min}
                        max={max}
                        colourScale={colourScale}
                        highlightedValue={hoveredAreaStat}
                        showPlusSignForChange={showPlusSignForChange}
                        hoveredAreaId={hoveredAreaId}
                    />
                </Box>
            )}
        </>
    );
}