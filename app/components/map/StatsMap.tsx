"use client";

import { Box } from "@mui/material";
import { Protocol } from "pmtiles";
import { useEffect, useRef, useCallback, useState } from "react";

import { scaleSequential, scaleSequentialQuantile } from "d3-scale";
import { interpolatePlasma } from "d3-scale-chromatic";
import * as maplibregl from 'maplibre-gl';
import { MapLayerMouseEvent, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Layer, MapRef, Source } from "react-map-gl/maplibre";
import api from "../../api";
import AreaLayer from "./AreaLayer";
import MAP_COLOURS from "./MapColours";
import MapViewOptions from "./MapViewOptions";
import MapInfoBox from "./MapInfoBox";
import { layers, namedFlavor } from "@protomaps/basemaps";
import axios from 'axios';


setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

type DBRow = Record<string, string | number>;

const MAP_STYLE = {
  version: 8 as const,
  glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
  sprite: "https://protomaps.github.io/basemaps-assets/sprites/v4/light",
  sources: {},
  layers: [{ id: "background", type: "background" as const, paint: { "background-color": MAP_COLOURS["background"] } }],
};

const DEFAULT_VIEW = { longitude: 174, latitude: -41, zoom: 3.5 }

const IGNORED_LAYERS = [
  "landuse",
  "pois",
  "buildings",
  "boundaries",
  "background" // Only way I could figure out how to set the background to what I want for non-existent tiles
]

const MAP_FLAVOUR = {
  ...namedFlavor("light"),
  "water": MAP_COLOURS["background"],
};

const BASEMAP_LAYERS = layers("stats-map", MAP_FLAVOUR, { lang: "en" }).filter(
  (l) => !IGNORED_LAYERS.includes(l.id)
)

const INTERACTIVE_LAYERS = ["ta-areas-fill", "sa3-areas-fill", "sa2-areas-fill", "sa1-areas-fill"];


function updateMapStatsEffect(chosenVariable: any, setMapStats: any, setMinVariableValue: any, setMaxVariableValue: any) {
  const CENSUS_YEAR = 2023; // Set as a constant for now.

  if (chosenVariable) {
    axios.get(`/api/stats/variable/${chosenVariable}/${CENSUS_YEAR}`)
      .then((res) => {
        let newMapStats: Record<string, DBRow> = {};
        let newMinVariableValue: number = Infinity;
        let newMaxVariableValue: number = -Infinity;

        console.log("first row of data:", res.data[0]);

        for (let row of res.data) {
          newMapStats[`${row.census_year}-${row.area_code}`] = row; // This matches area_id from the pimtiles file
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
  } else {
    setMapStats(null);
    setMinVariableValue(null);
    setMaxVariableValue(null);
  }
}

function layerIdToSourceId(sourceId: string): string {
  return sourceId === "sa1" ? "sa1-map" : "stats-map";
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
    const next = { source: layerIdToSourceId(feature.sourceLayer), sourceLayer: feature.sourceLayer, id: feature.id };
    map.setFeatureState(next, { selected: true });
    selectedFeature.current = next;
  }
  setChosenAreaId(feature?.properties?.area_id ?? null);
}

function setHoveredFeature(e: MapLayerMouseEvent, mapRef: any, hoveredFeature: any, clearHover: () => void) {
  const feature = e.features?.[0];
  const map = mapRef.current?.getMap();
  if (!map) return;

  clearHover();

  if (feature?.id !== undefined && feature.sourceLayer) {
    const next = { source: layerIdToSourceId(feature.sourceLayer), sourceLayer: feature.sourceLayer, id: feature.id };
    map.setFeatureState(next, { hover: true });
    hoveredFeature.current = next;
  }
}

function areaColouringEffect(mapRef: any, mapStats: Record<string, DBRow> | null, minVariableValue: any, maxVariableValue: any) {
  const map = mapRef.current?.getMap();
  if (!map) return;

  if (!mapStats) {
    // Fallback to default grey colouring if no stats are available
    for (const sourceLayer of ["ta", "sa3", "sa2", "sa1"]) {
      map.removeFeatureState({
        source: layerIdToSourceId(sourceLayer),
        sourceLayer,
      });
    }
    return;
  }

  // const filteredValues = Object.values(mapStats)
  //   .map((row) => row.variable_value as number | undefined)
  //   .filter((v): v is number => v !== undefined && v !== null && Number.isFinite(v));

  // const colorScale = scaleSequentialQuantile(filteredValues, interpolatePlasma)

  const colorScale = scaleSequential(interpolatePlasma)
    .domain([minVariableValue, maxVariableValue]);

  for (const [areaId, row] of Object.entries(mapStats)) {
    const value = row.variable_value as number | undefined;
    if (value === undefined) continue;

    const featureId = areaId;
    const areaCode = row.area_code as string;

    let sourceLayer = "sa1";
    if (areaCode.length == 6) {
      sourceLayer = "sa2";
    } else if (areaCode.length == 5) {
      sourceLayer = "sa3";
    } else if (areaCode.length == 3) {
      sourceLayer = "ta";
    }

    map.setFeatureState(
      { source: layerIdToSourceId(sourceLayer), sourceLayer, id: featureId },
      { fillColor: colorScale(value) }
    );
  }
}

export default function StatsMap({ chosenAreaId, setChosenAreaId, variableIdsToNameMap }: { chosenAreaId: string | null; setChosenAreaId: (id: string | null) => void; variableIdsToNameMap: Record<string, string> }) {

  const mapRef = useRef<MapRef>(null);
  const hoveredFeature = useRef<{ source: string; sourceLayer: string; id: string | number } | null>(null);
  const selectedFeature = useRef<{ source: string; sourceLayer: string; id: string | number } | null>(null);

  const [chosenVariable, setChosenVariable] = useState<string | null>(null);
  const [mapStats, setMapStats] = useState<Record<string, DBRow> | null>({});

  const [minVariableValue, setMinVariableValue] = useState<number | null>(null);
  const [maxVariableValue, setMaxVariableValue] = useState<number | null>(null);

  const [hoveredAreaName, setHoveredAreaName] = useState<string | null>(null);
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);
  const [hoveredAreaStat, setHoveredAreaStat] = useState<number | null>(null);

  const [variableIdToUnitMap, setVariableIdToUnitMap] = useState<Record<string, string>>({});

  const [mapGranularity, setMapGranularity] = useState<string | null>("auto");

  const clearHover = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map && hoveredFeature.current) {
      map.setFeatureState(hoveredFeature.current, { hover: false });
    }
    hoveredFeature.current = null;
    setHoveredAreaId(null);
    setHoveredAreaName(null);
    setHoveredAreaStat(null);
  }, []);

  const handleMapHover = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    const featureId = feature?.id;
    const sourceLayer = feature?.sourceLayer;

    if (
      hoveredFeature.current?.id === featureId &&
      hoveredFeature.current?.sourceLayer === sourceLayer
    ) {
      return;
    }

    setHoveredFeature(e, mapRef, hoveredFeature, clearHover);

    const areaId = (feature?.properties?.area_id as string) ?? null;
    setHoveredAreaId(areaId);
    setHoveredAreaName((feature?.properties?.area_name as string) ?? null);
    setHoveredAreaStat(areaId ? mapStats?.[areaId]?.variable_value as number ?? null : null);
  }, [mapStats]);

  useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => maplibregl.removeProtocol("pmtiles");
  }, []);

  useEffect(() => {
    axios.get(`/api/stats/variable/ids/to-unit`)
      .then((res) => {
        setVariableIdToUnitMap(res.data);
      });
  }, []);

  useEffect(() => {
    updateMapStatsEffect(chosenVariable, setMapStats, setMinVariableValue, setMaxVariableValue);
  }, [chosenVariable]);

  useEffect(() => {
    areaColouringEffect(mapRef, mapStats, minVariableValue, maxVariableValue);
  }, [mapStats, minVariableValue, maxVariableValue]);

  const ZOOM_RANGES: Record<string, [number | undefined, number | undefined]> = {
    "ta": [0, 6],
    "sa3": [6, 9],
    "sa2": [9, 12],
    "sa1": [12, 24],
  }

  const getZoomRangeForLayer = (layerId: string) => {
    if (mapGranularity === "auto") return ZOOM_RANGES[layerId];
    return (mapGranularity === layerId ? [0, 24] : [24, 24]);
  }

  const resetZoom = () => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    map.flyTo({
      center: [DEFAULT_VIEW.longitude, DEFAULT_VIEW.latitude],
      zoom: DEFAULT_VIEW.zoom,
      duration: 1000,
      bearing: 0,
      pitch: 0
    });
  }

  return (
    <>

      <Box id={"stats-map"}>
        <MapViewOptions
          resetZoom={resetZoom}
          setChosenVariable={setChosenVariable}
          variableIdsToNameMap={variableIdsToNameMap}
          mapGranularity={mapGranularity}
          setMapGranularity={setMapGranularity}
        />

        <MapInfoBox
          min={minVariableValue}
          max={maxVariableValue}
          hoveredAreaName={hoveredAreaName}
          hoveredAreaId={hoveredAreaId}
          hoveredAreaStat={hoveredAreaStat}
          variableUnit={chosenVariable && variableIdToUnitMap[chosenVariable]}
        />

        <Map
          ref={mapRef}
          initialViewState={DEFAULT_VIEW} // Centered on approx the tasman, zoom includes outlying islands
          mapStyle={MAP_STYLE}
          interactiveLayerIds={INTERACTIVE_LAYERS}
          onMouseMove={(e: MapLayerMouseEvent) => handleMapHover(e)}
          onMouseLeave={clearHover}
          onClick={(e: MapLayerMouseEvent) => handleMapClick(e, mapRef, selectedFeature, setChosenAreaId)}
          cursor="pointer"
          attributionControl={false}
          onZoomEnd={(e) => console.log("zoom settled at:", e.viewState.zoom)}
          maxBounds={[-205.400391, -49.667628, -169.628906, -30.977609]}
        >
          <Source
            id="stats-map"
            type="vector"
            url={`pmtiles://${process.env.NEXT_PUBLIC_API_HOST}/pmtiles/combined.pmtiles`}
            promoteId={{ ta: "area_id", sa3: "area_id", sa2: "area_id" }} // Keys for featureIds per layer
          >
            {BASEMAP_LAYERS.map((l) => <Layer key={l.id} {...l} />)}
            {(["ta", "sa3", "sa2"] as const).map((id) => {
              const [minZoom, maxZoom] = getZoomRangeForLayer(id);
              return <AreaLayer key={id} layerId={id} sourceId={"stats-map"} minZoom={minZoom} maxZoom={maxZoom} />;
            })}
          </Source>

          <Source
            id="sa1-map"
            type="vector"
            url={`pmtiles://${process.env.NEXT_PUBLIC_API_HOST}/pmtiles/sa1.pmtiles`}
            promoteId={{ sa1: "area_id" }}
          >
            {(() => {
              const [minZoom, maxZoom] = getZoomRangeForLayer("sa1");
              return (
                <AreaLayer
                  key={"sa1"}
                  layerId={"sa1"}
                  sourceId={"sa1-map"}
                  minZoom={minZoom}
                  maxZoom={maxZoom}
                />
              );
            })()}
          </Source>
        </Map>
      </Box >
    </>
  );
}