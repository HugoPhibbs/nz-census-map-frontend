"use client";

import { useEffect, useRef, useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { Protocol } from "pmtiles";

import Map, { Source, Layer, MapRef } from "react-map-gl/maplibre";
import * as maplibregl from 'maplibre-gl';
import { setWorkerUrl, MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import api from "../api";
import { stringToUint8Array } from "next/dist/server/app-render/encryption-utils";

setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

type DBRow = Record<string, string | number>;

const MAP_COLOURS = {
  "background": "#DBF3FA",
  "areaFill": "#FFB38A",
  "areaBorder": "white",
  "areaBorderHover": "black",
  "areaBorderSelected": "black",
  "areaFillSelected": "#FF9248"
}

function AreaLayer({
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
      source="areas"
      source-layer={layerId}
      minzoom={minZoom}
      maxzoom={maxZoom}
      paint={{
        "fill-color": [
          "case",
          ["boolean", ["feature-state", "selected"], false], MAP_COLOURS["areaFillSelected"],
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
      source="areas"
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

function MapFilter({ chosenVariable, setChosenVariable }: { chosenVariable: string | null; setChosenVariable: (variable: string) => void }) {

  let [variableOptions, setVariableOptions] = useState<string[]>([]);

  useEffect(() => {
    api.get(`/stats/variable/names`)
      .then((res) => setVariableOptions(res.data));
  }, [])

  return <Box>
    <FormControl id="map-filter">
      <InputLabel id="select-variable">Display by</InputLabel>
      <Select value={chosenVariable ?? ''} onChange={(e) => e.target.value && setChosenVariable(e.target.value)} label="Display by">
        {variableOptions.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Box>
}

const MAP_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [{ id: "background", type: "background" as const, paint: { "background-color": MAP_COLOURS["background"] } }],
};

const INTERACTIVE_LAYERS = ["ta-areas-fill", "sa3-areas-fill", "sa2-areas-fill"];

export default function StatsMap({ chosenAreaId, setChosenAreaId }: { chosenAreaId: string | null; setChosenAreaId: (id: string | null) => void }) {

  const mapRef = useRef<MapRef>(null);
  const hoveredFeature = useRef<{ source: string; sourceLayer: string; id: string | number } | null>(null);
  const selectedFeature = useRef<{ source: string; sourceLayer: string; id: string | number } | null>(null);

  const [chosenVariable, setChosenVariable] = useState<string | null>(null);
  const [mapStats, setMapStats] = useState<Record<string, DBRow> | null>({});

  const [minVariableValue, setMinVariableValue] = useState<number | null>(null);
  const [maxVariableValue, setMaxVariableValue] = useState<number | null>(null);

  const CENSUS_YEAR = 2023; // Set as a constant for now.

  useEffect(() => {
    if (chosenVariable) {
      api.get(`/stats/variable/${chosenVariable}/${CENSUS_YEAR}`)
        .then((res) => {
          let newMapStats: Record<string, DBRow> = {};
          for (let row of res.data) {
            let areaCode: string = row.area_code;
            delete row.area_code;
            newMapStats[areaCode] = row;
            if (minVariableValue === null || row.variable_value < minVariableValue) {
              setMinVariableValue(row.variable_value);
            }
            if (maxVariableValue === null || row.variable_value > maxVariableValue) {
              setMaxVariableValue(row.variable_value);
            }
          }
          console.log(newMapStats);
          console.log("minVariableValue", minVariableValue);
          console.log("maxVariableValue", maxVariableValue);
          setMapStats(newMapStats);
        });
    }
  }, [chosenVariable]);

  useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => maplibregl.removeProtocol("pmtiles");
  }, []);

  const handleClick = (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (selectedFeature.current) {
      map.setFeatureState(selectedFeature.current, { selected: false });
      selectedFeature.current = null;
    }

    if (feature?.id !== undefined && feature.sourceLayer) {
      const next = { source: "areas", sourceLayer: feature.sourceLayer, id: feature.id };
      map.setFeatureState(next, { selected: true });
      selectedFeature.current = next;
    }
    setChosenAreaId(feature?.properties?.area_id ?? null);
  };

  const clearHover = () => {
    const map = mapRef.current?.getMap();
    if (map && hoveredFeature.current) {
      map.setFeatureState(hoveredFeature.current, { hover: false });
    }
    hoveredFeature.current = null;
  };

  const handleMouseMove = (e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Check if already hovering on this feature
    if (feature && hoveredFeature.current?.id === feature.id && hoveredFeature.current?.sourceLayer === feature.sourceLayer) {
      return;
    }

    clearHover();

    if (feature?.id !== undefined && feature.sourceLayer) {
      const next = { source: "areas", sourceLayer: feature.sourceLayer, id: feature.id };
      map.setFeatureState(next, { hover: true });
      hoveredFeature.current = next;
    }
  };

  return (
    <Box id={"regional-map"}>
      <MapFilter chosenVariable={chosenVariable} setChosenVariable={setChosenVariable} />
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 174, latitude: -41, zoom: 4.5 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        interactiveLayerIds={INTERACTIVE_LAYERS}
        onMouseMove={handleMouseMove}
        onMouseLeave={clearHover}
        onClick={(e: MapLayerMouseEvent) => {
          handleClick(e);
        }}
        cursor="pointer"
      >
        <Source
          id="areas"
          type="vector"
          url={`pmtiles://${process.env.NEXT_PUBLIC_API_HOST}/area-boundaries.pmtiles`}
          promoteId={{ ta: "area_id", sa3: "area_id", sa2: "area_id" }}
        >
          <Layer id="base-fill" type="fill" source="areas" source-layer="coastline"
            paint={{ "fill-color": MAP_COLOURS["areaFill"], "fill-opacity": 0.8 }} />
          <AreaLayer layerId="ta" maxZoom={8} chosenAreaId={chosenAreaId} />
          <AreaLayer layerId="sa3" minZoom={8} maxZoom={10} chosenAreaId={chosenAreaId} />
          <AreaLayer layerId="sa2" minZoom={10} chosenAreaId={chosenAreaId} />
        </Source>
      </Map>
    </Box>
  );
}