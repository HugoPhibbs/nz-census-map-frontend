"use client";

import {Layer} from "react-map-gl/maplibre";
import MAP_COLOURS from "./MapColours";

export default function AreaLayer({
  layerId, maxZoom, minZoom, chosenAreaId,
}: {
  layerId: string;
  maxZoom?: number;
  minZoom?: number;
  chosenAreaId: string | null;
}) {
  return <>
    <Layer
      id={`${layerId}-areas-fill`}
      type="fill"
      source="stats-map"
      source-layer={layerId}
      minzoom={minZoom}
      maxzoom={maxZoom}
      paint={{
        "fill-color": [
          "coalesce",
          ["feature-state", "fillColor"],
          MAP_COLOURS["areaFill"],
        ],
        "fill-opacity": 0.6,
      }}
    />

    <Layer
      id={`${layerId}-areas-border`}
      type="line"
      source="stats-map"
      source-layer={layerId}
      minzoom={minZoom}
      maxzoom={maxZoom}
      paint={{ "line-color": MAP_COLOURS["areaBorder"], "line-width": 1 }}
    />

    <Layer
      id={`${layerId}-areas-hover`}
      type="line"
      source="stats-map"
      source-layer={layerId}
      minzoom={minZoom}
      maxzoom={maxZoom}
      paint={{
        "line-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          MAP_COLOURS["areaBorderHover"],
          "rgba(0,0,0,0)",
        ],
        "line-width": 2,
      }}
    />

    <Layer
      id={`${layerId}-areas-selected`}
      type="line"
      source="stats-map"
      source-layer={layerId}
      minzoom={minZoom}
      maxzoom={maxZoom}
      paint={{
        "line-color": [
          "case",
          ["boolean", ["feature-state", "selected"], false], MAP_COLOURS["areaBorderSelected"],
          "rgba(0,0,0,0)",
        ],
        "line-width": 2,
      }}
    />
  </>
}