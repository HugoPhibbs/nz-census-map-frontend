"use client";

import { useEffect, useRef, useState } from "react";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { Protocol } from "pmtiles";

import Map, { Source, Layer, MapRef } from "react-map-gl/maplibre";
import * as maplibregl from 'maplibre-gl';
import { setWorkerUrl, MapLayerMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import api from "../api";
import { scaleSequential } from "d3-scale";
import { interpolateInferno } from "d3-scale-chromatic";

setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

type DBRow = Record<string, string | number>;

const MAP_COLOURS = {
  "background": "#DBF3FA",
  "areaFill": "grey",
  "areaBorder": "white",
  "areaBorderHover": "black",
  "areaBorderSelected": "black",
  "areaFillSelected": "#FF9248"
}

const MAP_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [{ id: "background", type: "background" as const, paint: { "background-color": MAP_COLOURS["background"] } }],
};

const INTERACTIVE_LAYERS = ["ta-areas-fill", "sa3-areas-fill", "sa2-areas-fill"];

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
          "coalesce",
          ["feature-state", "fillColor"],
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

function updateMapStatsEffect(chosenVariable: any, setMapStats: any, setMinVariableValue: any, setMaxVariableValue: any) {
  const CENSUS_YEAR = 2023; // Set as a constant for now.

  if (chosenVariable) {
    api.get(`/stats/variable/${chosenVariable}/${CENSUS_YEAR}`)
      .then((res) => {
        let newMapStats: Record<string, DBRow> = {};
        let newMinVariableValue: number = Infinity;
        let newMaxVariableValue: number = -Infinity;

        console.log(res.data[0]);

        for (let row of res.data) {
          newMapStats[`${row.census_year}-${row.area_code}`] = row;
          if (row.variable_value && row.variable_value < newMinVariableValue) {
            newMinVariableValue = row.variable_value;
          }
          if (row.variable_value && row.variable_value > newMaxVariableValue) {
            newMaxVariableValue = row.variable_value;
          }
        }
        setMapStats(newMapStats);
        setMinVariableValue(newMinVariableValue);
        setMaxVariableValue(newMaxVariableValue);
      });
  }
}

function handleMapClick(e: MapLayerMouseEvent, mapRef: any, selectedFeature: any, setChosenAreaId: any) {
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
}

function handleMouseMove(e: MapLayerMouseEvent, mapRef: any, hoveredFeature: any, clearHover: () => void) {
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
}

function areaColouringEffect(mapRef: any, mapStats: Record<string, DBRow> | null, minVariableValue: any, maxVariableValue: any) {
  const map = mapRef.current?.getMap();
  if (!map || !mapStats || minVariableValue === null || maxVariableValue === null) return;

  const colorScale = scaleSequential(interpolateInferno)
    .domain([minVariableValue, maxVariableValue]);

  for (const [areaId, row] of Object.entries(mapStats)) {
    const value = row.variable_value as number | undefined;
    if (value === undefined) continue;

    const featureId = areaId;
    const areaCode = row.area_code as string;

    let sourceLayer = "sa2";
    if (areaCode.length == 5) {
      sourceLayer = "sa3";
    } else if (areaCode.length == 3) {
      sourceLayer = "ta";
    }

    map.setFeatureState(
      { source: "areas", sourceLayer, id: featureId },
      { fillColor: colorScale(value) }
    );
  }
}

export default function StatsMap({ chosenAreaId, setChosenAreaId }: { chosenAreaId: string | null; setChosenAreaId: (id: string | null) => void }) {

  const mapRef = useRef<MapRef>(null);
  const hoveredFeature = useRef<{ source: string; sourceLayer: string; id: string | number } | null>(null);
  const selectedFeature = useRef<{ source: string; sourceLayer: string; id: string | number } | null>(null);

  const [chosenVariable, setChosenVariable] = useState<string | null>(null);
  const [mapStats, setMapStats] = useState<Record<string, DBRow> | null>({});

  const [minVariableValue, setMinVariableValue] = useState<number | null>(null);
  const [maxVariableValue, setMaxVariableValue] = useState<number | null>(null);

  const clearHover = () => {
    const map = mapRef.current?.getMap();
    if (map && hoveredFeature.current) {
      map.setFeatureState(hoveredFeature.current, { hover: false });
    }
    hoveredFeature.current = null;
  };

  useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => maplibregl.removeProtocol("pmtiles");
  }, []);

  useEffect(() => {
    updateMapStatsEffect(chosenVariable, setMapStats, setMinVariableValue, setMaxVariableValue);
  }, [chosenVariable]);

  useEffect(() => {
    areaColouringEffect(mapRef, mapStats, minVariableValue, maxVariableValue);
  }, [mapStats, minVariableValue, maxVariableValue]);

  return (
    <Box id={"regional-map"}>
      <MapFilter chosenVariable={chosenVariable} setChosenVariable={setChosenVariable} />
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 174, latitude: -41, zoom: 4.5 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        interactiveLayerIds={INTERACTIVE_LAYERS}
        onMouseMove={(e: MapLayerMouseEvent) => handleMouseMove(e, mapRef, hoveredFeature, clearHover)}
        onMouseLeave={clearHover}
        onClick={(e: MapLayerMouseEvent) => handleMapClick(e, mapRef, selectedFeature, setChosenAreaId)}
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