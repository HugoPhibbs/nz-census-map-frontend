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

function AreaLayer({
  layerId, maxZoom, minZoom, hoveredId, selectedId,
}: {
  layerId: string; maxZoom?: number; minZoom?: number;
  hoveredId: number | null; selectedId: number | null;
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
          ["==", ["get", "region_id"], selectedId ?? -1], "#2c5d8a", // darker blue
          "steelblue",
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
      paint={{
        "line-color": [
          "case",
          ["==", ["get", "region_id"], selectedId ?? -1], "black",
          ["==", ["get", "region_id"], hoveredId ?? -1], "black",
          "white",
        ],
        "line-width": [
          "case",
          ["==", ["get", "region_id"], selectedId ?? -1], 2,
          ["==", ["get", "region_id"], hoveredId ?? -1], 2,
          1,
        ],
      }}
    />
  </>
}

export default function RegionalMap({ setChosenRegionId }: { setChosenRegionId: (id: number | null) => void }) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const INTERACTIVE_LAYERS = ["ta-areas-fill", "sa3-areas-fill", "sa2-areas-fill"];

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
        mapStyle={{
          version: 8,
          sources: {},
          layers: [{ id: "background", type: "background", paint: { "background-color": "#dddddd" } }],
        }}
        interactiveLayerIds={INTERACTIVE_LAYERS}
        onMouseMove={(e: MapLayerMouseEvent) => setHoveredId(e.features?.[0]?.properties?.region_id ?? null)}
        onMouseLeave={() => setHoveredId(null)}
        onClick={(e: MapLayerMouseEvent) => {
          const id = e.features?.[0]?.properties?.region_id ?? null;
          setSelectedId(id);
          setChosenRegionId(id);
        }}
        cursor="pointer"
      >
        <Source
          id="areas"
          type="vector"
          url={`pmtiles://${process.env.NEXT_PUBLIC_API_HOST}/area-boundaries.pmtiles`}
        >
          <Layer id="base-fill" type="fill" source="areas" source-layer="coastline"
            paint={{ "fill-color": "steelblue", "fill-opacity": 0.8 }} />
          <AreaLayer layerId="ta" maxZoom={8} hoveredId={hoveredId} selectedId={selectedId} />
          <AreaLayer layerId="sa3" minZoom={8} maxZoom={10} hoveredId={hoveredId} selectedId={selectedId} />
          <AreaLayer layerId="sa2" minZoom={10} hoveredId={hoveredId} selectedId={selectedId} />
        </Source>
      </Map>
    </Box>
  );
}