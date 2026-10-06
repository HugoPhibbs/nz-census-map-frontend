"use client";

import { Box, useMediaQuery, useColorScheme } from "@mui/material";
import { Protocol } from "pmtiles";
import { useEffect, useRef, useCallback, useState, useMemo } from "react";

import { scaleSequential } from "d3-scale";
import { interpolatePlasma } from "d3-scale-chromatic";
import * as maplibregl from 'maplibre-gl';
import { MapLayerMouseEvent, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Layer, MapRef, Source } from "react-map-gl/maplibre";
import AreaLayer from "./AreaLayer";
import MapViewOptions from "./MapViewOptions";
import MapInfoBox from "./MapInfoBox";
import { layers, namedFlavor } from "@protomaps/basemaps";
import api from "@/app/api";
import { getMapColours } from "./MapConstants";
import { DEFAULT_CHOSEN_MAP_VARIABLE, AREA_TYPE, ZOOM_RANGES } from "./MapConstants";

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

function updateMapStatsEffect(chosenVariable: any, setMapStats: any, setMinVariableValue: any, setMaxVariableValue: any) {
  const CENSUS_YEAR = 2023; // Set as a constant for now.

  if (chosenVariable) {
    api.get(`/stats/variable/${chosenVariable}/${CENSUS_YEAR}`)
      .then((res) => {
        let newMapStats: Record<string, DBRow> = {};
        let newMinVariableValue: number = Infinity;
        let newMaxVariableValue: number = -Infinity;

        for (let [areaCode, variableValue] of res.data) {
          newMapStats[`${CENSUS_YEAR}-${areaCode}`] = { "area_code": areaCode, "variable_value": variableValue }; // This matches area_id from the pimtiles file
          if (variableValue && variableValue < newMinVariableValue) {
            newMinVariableValue = variableValue;
          }
          if (variableValue && variableValue > newMaxVariableValue) {
            newMaxVariableValue = variableValue;
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

function getZoomRangeForLayer(layerId: AREA_TYPE, mapGranularity: string | null) {
  if (mapGranularity === "auto") return ZOOM_RANGES[layerId];
  return (mapGranularity === layerId ? [0, 24] : [24, 24]);
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

type StatsMapProps = {
  setChosenAreaId: (id: string | null) => void;
  variableIdsToNameMap: Record<string, string>;
  variableIdsToUnitMap: Record<string, string>;
};

export default function StatsMap({ setChosenAreaId, variableIdsToNameMap, variableIdsToUnitMap }: StatsMapProps) {

  const mapRef = useRef<MapRef>(null);
  const hoveredFeature = useRef<{ source: string; sourceLayer: string; id: string | number } | null>(null);
  const selectedFeature = useRef<{ source: string; sourceLayer: string; id: string | number } | null>(null);

  const [chosenVariable, setChosenVariable] = useState<string | null>(DEFAULT_CHOSEN_MAP_VARIABLE);
  const [mapStats, setMapStats] = useState<Record<string, DBRow> | null>({});

  const [minVariableValue, setMinVariableValue] = useState<number | null>(null);
  const [maxVariableValue, setMaxVariableValue] = useState<number | null>(null);

  const [hoveredAreaName, setHoveredAreaName] = useState<string | null>(null);
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);
  const [hoveredAreaStat, setHoveredAreaStat] = useState<number | null>(null);

  const [mapGranularity, setMapGranularity] = useState<string | null>("auto");

  const { mode } = useColorScheme();
  const resolvedMode = mode === "dark" ? "dark" : "light";
  const mapColours = getMapColours(resolvedMode);

  const basemapLayers = useMemo(() => {
    const flavour = { ...namedFlavor(resolvedMode), water: mapColours.background };
    return layers("stats-map", flavour, { lang: "en" })
      .filter((l) => !IGNORED_BASEMAP_LAYERS.includes(l.id));
  }, [resolvedMode, mapColours.background]);

  const isPhone = useMediaQuery('(max-width:600px)');
  const defaultView = isPhone ?
    { longitude: 172.58, latitude: -41.5, zoom: 4.2 } :
    { longitude: 172.58, latitude: -40.7, zoom: 4.3 };

  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Basically we need mapLoaded so sprites are set once the map is loaded.
    // Without this, no sprites are rendered bc resolvedMode doesn't change before the map (this hook) is loaded
    if (!mapLoaded) return;
    const spriteUrl =  `https://protomaps.github.io/basemaps-assets/sprites/v4/${resolvedMode}`;
    mapRef.current?.getMap().setSprite(spriteUrl);
  }, [mapLoaded, resolvedMode]);

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
    updateMapStatsEffect(chosenVariable, setMapStats, setMinVariableValue, setMaxVariableValue);
  }, [chosenVariable]);

  useEffect(() => {
    areaColouringEffect(mapRef, mapStats, minVariableValue, maxVariableValue);
  }, [mapStats, minVariableValue, maxVariableValue]);

  const resetZoom = () => {
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

  return (
    <>
      <Box id={"stats-map"}>
        <MapViewOptions
          resetZoom={resetZoom}
          setChosenVariable={setChosenVariable}
          variableIdsToNameMap={variableIdsToNameMap}
          mapGranularity={mapGranularity}
          setMapGranularity={setMapGranularity}
          map={mapLoaded ? mapRef.current?.getMap() ?? null : null}
        />

        <MapInfoBox
          min={minVariableValue}
          max={maxVariableValue}
          hoveredAreaName={hoveredAreaName}
          hoveredAreaId={hoveredAreaId}
          hoveredAreaStat={hoveredAreaStat}
          variableUnit={chosenVariable && variableIdsToUnitMap[chosenVariable]}
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
              const [minZoom, maxZoom] = getZoomRangeForLayer(id, mapGranularity);
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
              const [minZoom, maxZoom] = getZoomRangeForLayer("sa1", mapGranularity);
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