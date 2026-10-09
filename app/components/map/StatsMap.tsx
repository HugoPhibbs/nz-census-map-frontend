"use client";

import { Box, useMediaQuery, useColorScheme } from "@mui/material";
import { Protocol } from "pmtiles";
import { useEffect, useRef, useCallback, useState, useMemo } from "react";

import { scaleDiverging, scaleSequential } from "d3-scale";
import { interpolatePlasma, interpolatePRGn } from "d3-scale-chromatic";
import * as maplibregl from 'maplibre-gl';
import { MapLayerMouseEvent, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Layer, MapRef, Source } from "react-map-gl/maplibre";
import AreaLayer from "./AreaLayer";
import MapViewOptions from "./MapViewOptions";
import MapInfoBox from "./MapInfoBox";
import { layers, namedFlavor } from "@protomaps/basemaps";
import api from "@/app/api";
import { getMapColours, ColourScale } from "./MapConstants";
import { DEFAULT_CHOSEN_MAP_VARIABLE, DEFAULT_ZOOM_RANGES } from "./MapConstants";
import { areaIdToAreaType, AREA_TYPE, AREA_TYPES } from "@/app/utils";
import { extent, quantile } from "d3-array";

setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

if (typeof window !== 'undefined') {
  // Pre-fetch the .mjs module for faster loads. See https://maplibre.org/maplibre-gl-js/docs/API/functions/prewarm/
  maplibregl.prewarm();
}

type DBRow = Record<string, string | number>;

const MAP_STYLE = {
  version: 8 as const,
  glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
  sources: {},
  layers: [],
};

const MAP_BOUNDS: [number, number, number, number] = [-205.400391, -60, -169.628906, -20];

const IGNORED_BASEMAP_LAYERS = [
  "ta",
  "sa3",
  "sa2",
  "landuse",
  "pois",
  "buildings",
  "boundaries",
  "background" // Only way I could figure out how to set the background to what I want for non-existent tiles
]

const INTERACTIVE_LAYERS = ["ta-areas-fill", "sa3-areas-fill", "sa2-areas-fill", "sa1-areas-fill"];

type AreaTypeToValues = Partial<Record<AREA_TYPE, number[]>> | null;

function updateMapStatsEffect(chosenVariable: string | null,
  setMapStats: any,
  censusYear: number,
  censusYearCompareTo: number | null
) {
  const apiUrl = !censusYearCompareTo ?
    `/stats/variable/${chosenVariable}/${censusYear}` :
    `/stats/variable/${chosenVariable}/compare?from=${censusYear}&to=${censusYearCompareTo}`;

  if (chosenVariable) {
    api.get(apiUrl)
      .then((res) => {
        const newMapStats: Record<string, DBRow> = {};
        for (let [areaId, variableValue] of res.data) {
          newMapStats[areaId] = variableValue;
        }
        setMapStats(newMapStats);
      }).catch((err) => {
        console.error("Error fetching map stats:", err);
        setMapStats(null);
      });
  } else {
    setMapStats(null);
  }
}

function getAreaTypeToValues(mapStats: Record<string, number> | null): AreaTypeToValues {
  if (!mapStats) return null;

  const result: Partial<Record<AREA_TYPE, number[]>> = {};
  for (const [areaId, value] of Object.entries(mapStats)) {
    if (value == null) continue;
    const areaType = areaIdToAreaType(areaId) as AREA_TYPE;
    (result[areaType] ??= []).push(value);
  }
  return result;
}

function layerIdToSourceId(sourceId: AREA_TYPE): string {
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
    const next = { source: layerIdToSourceId(feature.sourceLayer as AREA_TYPE), sourceLayer: feature.sourceLayer, id: feature.id };
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
    const next = { source: layerIdToSourceId(feature.sourceLayer as AREA_TYPE), sourceLayer: feature.sourceLayer, id: feature.id };
    map.setFeatureState(next, { hover: true });
    hoveredFeature.current = next;
  }
}

function clearHoveredArea(
  mapRef: any,
  hoveredFeature: any,
  setHoveredAreaId: (areaId: string | null) => void,
  setHoveredAreaName: (areaName: string | null) => void,
  setHoveredAreaStat: (areaStat: number | null) => void
) {
  const map = mapRef.current?.getMap();
  if (map && hoveredFeature.current) {
    map.setFeatureState(hoveredFeature.current, { hover: false });
  }
  hoveredFeature.current = null;
  setHoveredAreaId(null);
  setHoveredAreaName(null);
  setHoveredAreaStat(null);
}

function updateHoveredArea(
  e: MapLayerMouseEvent,
  mapRef: any,
  hoveredFeature: any,
  clearHover: () => void,
  mapStats: Record<string, number> | null,
  setHoveredAreaId: (areaId: string | null) => void,
  setHoveredAreaName: (areaName: string | null) => void,
  setHoveredAreaStat: (areaStat: number | null) => void
) {
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
  setHoveredAreaStat(areaId ? mapStats?.[areaId] as number ?? null : null);
}

function getZoomRangeForLayer(layerId: AREA_TYPE, chosenMapGranularity: string | null) {
  if (chosenMapGranularity === "auto") return DEFAULT_ZOOM_RANGES[layerId];
  return (chosenMapGranularity === layerId ? [0, 24] : [24, 24]);
}

function variableIsAboutSexRatio(variableId: string): boolean {
  return variableId.startsWith("perc_sex_");
}

function getColourScaleFunction(
  values: number[],
  chosenVariable: string,
  isComparingCensusYears: boolean
): ColourScale {
  const isAboutSexRatio = variableIsAboutSexRatio(chosenVariable);
  if (isComparingCensusYears || isAboutSexRatio) {
    const centreOn = (isAboutSexRatio && !isComparingCensusYears) ? 50 : 0;
    const limit = quantile(values, 0.95, (v) => Math.abs(v - centreOn)) || 1;
    return scaleDiverging(interpolatePRGn).domain([centreOn - limit, centreOn, centreOn + limit]).clamp(true);
  } else {
    const [min, max] = extent(values) as [number, number];
    return scaleSequential(interpolatePlasma).domain([min, max]);
  }
}

function areaColouringEffect(
  mapRef: any,
  mapStats: Record<string, number> | null,
  colourScalesForAreaType : Record<AREA_TYPE, ColourScale> | null
) {
  const map = mapRef.current?.getMap();
  if (!map) return;

  if (!mapStats || !colourScalesForAreaType) {
    // Fallback to default grey colouring if no stats are available
    for (const sourceLayer of ["ta", "sa3", "sa2", "sa1"]) {
      map.removeFeatureState({
        source: layerIdToSourceId(sourceLayer as AREA_TYPE),
        sourceLayer,
      });
    }
    return;
  }

  for (const [areaId, variable_value] of Object.entries(mapStats)) {
    if (variable_value === undefined) continue;

    const featureId = areaId;
    const areaType = areaIdToAreaType(areaId);
    if (!areaType) {
      console.warn(`Unknown area type for areaId: ${areaId}`);
      continue;
    }

    map.setFeatureState(
      { source: layerIdToSourceId(areaType as AREA_TYPE), sourceLayer: areaType, id: featureId },
      { fillColor: colourScalesForAreaType[areaType](variable_value) }
    );
  }
}

function getAreaTypeByUsingZoomDefaults(zoomLevel: number): AREA_TYPE {
  for (const [areaType, [minZoom, maxZoom]] of Object.entries(DEFAULT_ZOOM_RANGES)) {
    if (zoomLevel >= minZoom && zoomLevel < maxZoom) {
      return areaType as AREA_TYPE;
    }
  }
  console.warn(`Zoom level ${zoomLevel} does not correspond to any area type`);
  return "ta"; // Default
}

function resetMapZoom(mapRef: any, defaultView: { longitude: number; latitude: number; zoom: number }) {
  const map = mapRef.current?.getMap();
  if (!map) return;

  map.flyTo({
    center: [defaultView.longitude, defaultView.latitude],
    zoom: defaultView.zoom,
    duration: 1000,
    bearing: 0,
    pitch: 0
  });
}

type StatsMapProps = {
  setChosenAreaId: (id: string | null) => void;
  variableIdsToNameMap: Record<string, string>;
  variableIdsToUnitMap: Record<string, string>;
  censusYear: number;
  setChosenCensusYear: (year: number) => void;
  availableYearsForVariables: Record<string, number[]>;
};

export default function StatsMap({
  setChosenAreaId,
  variableIdsToNameMap,
  variableIdsToUnitMap,
  censusYear,
  setChosenCensusYear,
  availableYearsForVariables
}: StatsMapProps) {

  const mapRef = useRef<MapRef>(null);
  const hoveredFeature = useRef<{ source: string; sourceLayer: string; id: string | number } | null>(null);
  const selectedFeature = useRef<{ source: string; sourceLayer: string; id: string | number } | null>(null);

  const [chosenVariable, setChosenVariable] = useState<string | null>(DEFAULT_CHOSEN_MAP_VARIABLE);
  const [mapStats, setMapStats] = useState<Record<string, number> | null>({});

  const areaTypeToValues = useMemo(() => getAreaTypeToValues(mapStats), [mapStats]);

  const [hoveredAreaName, setHoveredAreaName] = useState<string | null>(null);
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);
  const [hoveredAreaStat, setHoveredAreaStat] = useState<number | null>(null);

  const [censusYearCompareTo, setCensusYearCompareTo] = useState<number | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);

  const [chosenMapGranularity, setChosenMapGranularity] = useState<string | null>("auto"); // What user has chosen
  const [autoAreaType, setAutoAreaType] = useState<AREA_TYPE>("ta"); // What auto would be
  // What is actually viewed
  const activeAreaType = chosenMapGranularity === "auto" ? autoAreaType : (chosenMapGranularity as AREA_TYPE);

  // Adding pmtiles protocol
  useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => maplibregl.removeProtocol("pmtiles");
  }, []);

  // Handling dark mode
  const { mode } = useColorScheme();
  const resolvedMode = mode === "dark" ? "dark" : "light";
  const mapColours = getMapColours(resolvedMode);

  const basemapLayers = useMemo(() => {
    const flavour = { ...namedFlavor(resolvedMode), water: mapColours.background };
    return layers("stats-map", flavour, { lang: "en" })
      .filter((l) => !IGNORED_BASEMAP_LAYERS.includes(l.id));
  }, [resolvedMode, mapColours.background]);

  useEffect(() => {
    // Basically we need mapLoaded so sprites are set once the map is loaded.
    // Without this, no sprites are rendered bc resolvedMode doesn't change before the map (this hook) is loaded
    if (!mapLoaded) return;
    const spriteUrl = `https://protomaps.github.io/basemaps-assets/sprites/v4/${resolvedMode}`;
    mapRef.current?.getMap().setSprite(spriteUrl);
  }, [mapLoaded, resolvedMode]);

  // Handling hovers
  const clearHover = useCallback(() => {
    clearHoveredArea(mapRef, hoveredFeature, setHoveredAreaId, setHoveredAreaName, setHoveredAreaStat);
  }, []);

  const handleMapHover = useCallback((e: MapLayerMouseEvent) => {
    updateHoveredArea(e, mapRef, hoveredFeature, clearHover, mapStats, setHoveredAreaId, setHoveredAreaName, setHoveredAreaStat);
  }, [mapStats]);
  
  // Update autoAreaType whenever the zoom level changes
  useEffect(() => {
    const map = mapLoaded ? mapRef.current?.getMap() ?? null : null;
    if (!map) return;
    const onZoom = () => setAutoAreaType(getAreaTypeByUsingZoomDefaults(map.getZoom()));
    onZoom(); // Set the initial value, before any zooming happens
    map.on("zoom", onZoom);
    return () => { map.off("zoom", onZoom); }; // Clean up call back
  }, [mapLoaded]);

  // Updating mapstats
  useEffect(() => {
    updateMapStatsEffect(
      chosenVariable,
      setMapStats,
      censusYear,
      censusYearCompareTo
    );
  }, [chosenVariable, censusYear, censusYearCompareTo]);

  // Updating colour scales for each area type, given the current mapStats and chosenVariable
  const colourScalesForAreaType = useMemo(() => {
    if (!areaTypeToValues || !chosenVariable) return null;
    return Object.fromEntries(
      AREA_TYPES.flatMap((areaType) => {
        const values = areaTypeToValues[areaType];
        if (!values?.length) return [];
        return [[areaType, getColourScaleFunction(values, chosenVariable, !!censusYearCompareTo)]];
      })
    ) as Record<AREA_TYPE, ColourScale>;
  }, [areaTypeToValues, chosenVariable, censusYearCompareTo]);

  // Updating the map colouring whenever mapStats or the colour scales change
  useEffect(() => {
    areaColouringEffect(mapRef, mapStats, colourScalesForAreaType);
  }, [mapStats, colourScalesForAreaType]);

  const [activeMin, activeMax] = extent(areaTypeToValues?.[activeAreaType] ?? []);

  // Getting the default view
  const isPhone = useMediaQuery('(max-width:600px)');
  const defaultView = isPhone ?
    { longitude: 172.58, latitude: -41.5, zoom: 4.2 } :
    { longitude: 172.58, latitude: -40.7, zoom: 4.3 };

  return (
    <>
      <Box id={"stats-map"}>
        <MapViewOptions
          resetZoom={() => resetMapZoom(mapRef, defaultView)}
          setChosenVariable={setChosenVariable}
          variableIdsToNameMap={variableIdsToNameMap}
          chosenMapGranularity={chosenMapGranularity}
          setChosenMapGranularity={setChosenMapGranularity}
          setChosenCensusYear={setChosenCensusYear}
          chosenCensusYear={censusYear}
          setChosenCensusYearCompareTo={setCensusYearCompareTo}
          censusYearCompareTo={censusYearCompareTo}
          availableYearsForVariables={availableYearsForVariables}
          autoAreaType={autoAreaType}
        />

        <MapInfoBox
          min={activeMin ?? null}
          max={activeMax ?? null}
          colourScale={colourScalesForAreaType?.[activeAreaType] ?? null}
          hoveredAreaName={hoveredAreaName}
          hoveredAreaId={hoveredAreaId}
          hoveredAreaStat={hoveredAreaStat}
          variableUnit={chosenVariable && variableIdsToUnitMap[chosenVariable]}
          showPlusSignForChange={!!censusYearCompareTo}
        />

        <Map
          ref={mapRef}
          initialViewState={defaultView} // Centered on approx the tasman, zoom includes outlying islands
          mapStyle={MAP_STYLE}
          onLoad={() => setMapLoaded(true)}
          interactiveLayerIds={INTERACTIVE_LAYERS}
          onMouseMove={(e: MapLayerMouseEvent) => handleMapHover(e)}
          onMouseLeave={clearHover}
          onClick={(e: MapLayerMouseEvent) => handleMapClick(e, mapRef, selectedFeature, setChosenAreaId)}
          cursor="pointer"
          attributionControl={false}
          maxBounds={MAP_BOUNDS}
        >
          <Layer
            id="background"
            type="background"
            paint={{ "background-color": mapColours["background"] }}
          />

          <Source
            id="stats-map"
            type="vector"
            url={`pmtiles://${process.env.NEXT_PUBLIC_GCP_BUCKET_URL}/combined.pmtiles`}
            promoteId={{ ta: "area_id", sa3: "area_id", sa2: "area_id" }} // Keys for featureIds per layer
          >
            {basemapLayers.map((l) => {
              return <Layer key={l.id} {...l} />;
            })}

            {(["ta", "sa3", "sa2"] as const).map((id) => {
              const [minZoom, maxZoom] = getZoomRangeForLayer(id, chosenMapGranularity);
              return <AreaLayer
                key={id}
                layerId={id}
                sourceId={"stats-map"}
                minZoom={minZoom}
                maxZoom={maxZoom}
                colours={mapColours}
              />;
            })}
          </Source>

          <Source
            id="sa1-map"
            type="vector"
            url={`pmtiles://${process.env.NEXT_PUBLIC_GCP_BUCKET_URL}/sa1.pmtiles`}
            promoteId={{ sa1: "area_id" }}
          >
            {(() => {
              const [minZoom, maxZoom] = getZoomRangeForLayer("sa1", chosenMapGranularity);
              return (
                <AreaLayer
                  key={"sa1"}
                  layerId={"sa1"}
                  sourceId={"sa1-map"}
                  minZoom={minZoom}
                  maxZoom={maxZoom}
                  colours={mapColours}
                />
              );
            })()}
          </Source>
        </Map>
      </Box >
    </>
  );
}