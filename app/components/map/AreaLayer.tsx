"use client";

import { Layer } from "react-map-gl/maplibre";
import { MapColours } from "./MapConstants";

export default function AreaLayer({
  layerId, maxZoom, minZoom, sourceId, colours
}: {
  layerId: string;
  maxZoom?: number;
  minZoom?: number;
  sourceId: string;
  colours: MapColours;
}) {
  return <>
    <Layer
      id={`${layerId}-areas-fill`}
      type="fill"
      source={sourceId}
      source-layer={layerId}
      minzoom={minZoom}
      maxzoom={maxZoom}
      paint={{
        "fill-color": [
          "coalesce",
          ["feature-state", "fillColor"],
          colours.areaFill,
        ],
        "fill-opacity": 0.6,
      }}
    />

    <Layer
      id={`${layerId}-areas-border`}
      type="line"
      source={sourceId}
      source-layer={layerId}
      minzoom={minZoom}
      maxzoom={maxZoom}
      paint={{
        "line-color": colours.areaBorder,
        "line-width": layerId === "sa1" ? 0.5 : 1
      }}
    />

    <Layer
      id={`${layerId}-areas-hover`}
      type="line"
      source={sourceId}
      source-layer={layerId}
      minzoom={minZoom}
      maxzoom={maxZoom}
      paint={{
        "line-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          colours.areaBorderHover,
          "rgba(0,0,0,0)",
        ],
        "line-width": 2,
      }}
    />

    <Layer
      id={`${layerId}-areas-selected`}
      type="line"
      source={sourceId}
      source-layer={layerId}
      minzoom={minZoom}
      maxzoom={maxZoom}
      paint={{
        "line-color": [
          "case",
          ["boolean", ["feature-state", "selected"], false], 
          colours.areaBorderSelected,
          "rgba(0,0,0,0)",
        ],
        "line-width": 2,
      }}
    />
  </>
}