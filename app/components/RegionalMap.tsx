"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { Protocol } from "pmtiles";

import Map, { Source, Layer } from "react-map-gl/maplibre";
import * as maplibregl from 'maplibre-gl';
import { setWorkerUrl, MapLayerMouseEvent} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { min } from "d3";

setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

const MAP_COLOURS = {
  "background": "#DBF3FA",
  "areaFill": "#FFB38A",
  "areaBorder": "white",
  "areaBorderHover": "black",
  "areaBorderSelected": "black",
  "areaFillSelected": "#FF9248"
}

function AreaLayer({
  layerId, maxZoom, minZoom, hoveredId, chosenAreaId,
}: {
  layerId: string; maxZoom?: number; minZoom?: number;
  hoveredId: number | null; chosenAreaId: number | null;
}) {
  return <>
    <Layer
      id={`${layerId}-areas-fill`}
      type="fill"
      source="areas"
      source-layer={layerId}
      minzoom={minZoom}
      maxzoom={maxZoom}
      paint={{
        "fill-color": [
          "case",
          ["==", ["get", "area_id"], chosenAreaId ?? -1], MAP_COLOURS["areaFillSelected"],
          MAP_COLOURS["areaFill"],
        ],
        "fill-opacity": 0.8,
      }}
    />
    <Layer
      id={`${layerId}-areas-border`}
      type="line"
      source="areas"
      source-layer={layerId}
      minzoom={minZoom}
      maxzoom={maxZoom}
      paint={{ "line-color": MAP_COLOURS["areaBorder"], "line-width": 1 }}
    />

    <Layer
      id={`${layerId}-areas-hover`}
      type="line"
      source="areas"
      source-layer={layerId}
      minzoom={minZoom}
      maxzoom={maxZoom}
      filter={["==", ["get", "area_id"], hoveredId ?? ""]}
      paint={{ "line-color": MAP_COLOURS["areaBorderHover"], "line-width": 2 }}
    />

    <Layer
      id={`${layerId}-areas-selected`}
      type="line"
      source="areas"
      source-layer={layerId}
      minzoom={minZoom}
      maxzoom={maxZoom}
      filter={["==", ["get", "area_id"], chosenAreaId ?? ""]}
      paint={{ "line-color": MAP_COLOURS["areaBorderSelected"], "line-width": 2 }}
    />
  </>
}

const MAP_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [{ id: "background", type: "background" as const, paint: { "background-color": "#DBF3FA" } }],
};

const INTERACTIVE_LAYERS = ["ta-areas-fill", "sa3-areas-fill", "sa2-areas-fill"];

export default function RegionalMap({ chosenAreaId, setChosenAreaId }: { chosenAreaId: number | null; setChosenAreaId: (id: number | null) => void }) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => maplibregl.removeProtocol("pmtiles");
  }, []);

  return (
    <Box id={"regional-map"}>
      <Map
        initialViewState={{ longitude: 174, latitude: -41, zoom: 4.5 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        interactiveLayerIds={INTERACTIVE_LAYERS}
        onMouseMove={(e: MapLayerMouseEvent) => setHoveredId(e.features?.[0]?.properties?.area_id ?? null)}
        onMouseLeave={() => setHoveredId(null)}
        onClick={(e: MapLayerMouseEvent) => {
          const id = e.features?.[0]?.properties?.area_id ?? null;
          setChosenAreaId(id);
          setChosenAreaId(id);
        }}
        cursor="pointer"
      >
        <Source
          id="areas"
          type="vector"
          url={`pmtiles://${process.env.NEXT_PUBLIC_API_HOST}/area-boundaries.pmtiles`}
        >
          <Layer id="base-fill" type="fill" source="areas" source-layer="coastline"
            paint={{ "fill-color": MAP_COLOURS["areaFill"], "fill-opacity": 0.8 }} />
          <AreaLayer layerId="ta" maxZoom={8} hoveredId={hoveredId} chosenAreaId={chosenAreaId} />
          <AreaLayer layerId="sa3" minZoom={8} maxZoom={10} hoveredId={hoveredId} chosenAreaId={chosenAreaId} />
          <AreaLayer layerId="sa2" minZoom={10} hoveredId={hoveredId} chosenAreaId={chosenAreaId} />
        </Source>
      </Map>
    </Box>
  );
}