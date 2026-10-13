"use client";

import { Box, useMediaQuery } from "@mui/material";
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
import { AREA_TYPE, CHOSEN_MAP_GRANULARITY, ColourScale } from "@/app/types";
import { DEFAULT_CHOSEN_MAP_VARIABLE, DEFAULT_ZOOM_RANGES, BASEMAP_SOURCE_ID, BOUNDARIES_SA1_SOURCE_ID, BOUNDARIES_SA2_SA3_TA_SOURCE_ID } from "@/app/components/map/MapConstants";
import { areaIdToAreaType, AREA_TYPES, useColourMode, getMapColours, } from "@/app/utils";
import { extent, quantile } from "d3-array";

setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

if (typeof window !== 'undefined') {
  // Pre-fetch the .mjs module for faster loads. See https://maplibre.org/maplibre-gl-js/docs/API/functions/prewarm/
  maplibregl.prewarm();
}

const MAP_STYLE = {
  version: 8 as const,
  glyphs: "https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
  sources: {},
  layers: [],
};

const MAP_BOUNDS: [number, number, number, number] = [-205.400391, -60, -169.628906, -20];

const LAYERS_TO_EXCLUDE_FROM_BASEMAP = [
  "boundaries",
  "background", // Only way I could figure out how to set the background to what I want for non-existent tiles
  "roads_labels_major",
  "roads_labels_minor",
  "roads_shields",   // highway number badges
  "roads_oneway",
  "water_waterway_label"
]

const INTERACTIVE_LAYERS = ["ta-areas-fill", "sa3-areas-fill", "sa2-areas-fill", "sa1-areas-fill"];

type AreaTypeToValues = Partial<Record<AREA_TYPE, number[]>>;

type HoveredArea = { id: string; name: string | null };

type TargetFeature = { source: string; sourceLayer: AREA_TYPE; id: string | number };

function getAreaTargetFeature(areaId: string): TargetFeature {
  const areaType = areaIdToAreaType(areaId);
  return { source: layerIdToSourceId(areaType), sourceLayer: areaType, id: areaId };
}

function updateMapStatsEffect(
  chosenVariable: string | null,
  setMapStats: any,
  censusYear: number,
  censusYearCompareTo: number | null,
) {
  const apiUrl = !censusYearCompareTo ?
    `/stats/variable/${chosenVariable}/${censusYear}` :
    `/stats/variable/${chosenVariable}/compare?from=${censusYear}&to=${censusYearCompareTo}`;

  if (chosenVariable) {
    api.get(apiUrl)
      .then((res) => {
        setMapStats(res.data);
      }).catch((err) => {
        console.error("Error fetching map stats:", err);
        setMapStats(null);
      });
  } else {
    setMapStats(null);
  }
}

function getAreaTypeToValues(mapStats: Record<string, number> | null): AreaTypeToValues | null {
  if (!mapStats) return null;

  const result: Partial<Record<AREA_TYPE, number[]>> = {};
  for (const [areaId, value] of Object.entries(mapStats)) {
    if (value == null) continue;
    const areaType = areaIdToAreaType(areaId);
    (result[areaType] ??= []).push(value);
  }
  return result;
}

function layerIdToSourceId(sourceId: AREA_TYPE): string {
  return sourceId === "sa1" ? BOUNDARIES_SA1_SOURCE_ID : BOUNDARIES_SA2_SA3_TA_SOURCE_ID;
}

function getZoomRangeForLayer(layerId: AREA_TYPE, chosenMapGranularity: CHOSEN_MAP_GRANULARITY): [number, number] {
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
  console.assert(values.length > 0, "getColourScaleFunction called with empty values array");
  const isAboutSexRatio = variableIsAboutSexRatio(chosenVariable);
  if (isComparingCensusYears || isAboutSexRatio) {
    const centreOn = (isAboutSexRatio && !isComparingCensusYears) ? 50 : 0;
    const limit = quantile(values, 0.95, (v) => Math.abs(v - centreOn)) || 1; // || 1 for when 95% of of values equal centreOn, just so its not undefined
    // Using a [min, c, max] domain clamps values outside of [min, max], meaning they take the extreme colour values
    return scaleDiverging(interpolatePRGn).domain([centreOn - limit, centreOn, centreOn + limit])
  } else {
    const min = Math.min(...values);
    const max = quantile(values, 0.99) as number;
    return scaleSequential(interpolatePlasma).domain([min, max])
  }
}

function areaColouringEffect(
  mapRef: any,
  mapStats: Record<string, number> | null,
  colourScalesForAreaType: Record<AREA_TYPE, ColourScale> | null,
  areaIdsLastUpdated: React.RefObject<Set<string>>
) {
  const map = mapRef.current?.getMap();
  if (!map) return;
  const updatedAreaIds = new Set<string>();

  for (const [areaId, variable_value] of Object.entries(mapStats ?? {})) {
    if (variable_value == null) continue;

    const areaType = areaIdToAreaType(areaId);
    const colourScale = colourScalesForAreaType?.[areaType];

    if (!colourScale) continue; // Silently skip (logging a warning would be too spammy)

    map.setFeatureState(
      getAreaTargetFeature(areaId),
      { fillColor: colourScale(variable_value) }
    );

    updatedAreaIds.add(areaId);
  }

  for (const areaId of areaIdsLastUpdated.current) {
    if (!updatedAreaIds.has(areaId)) {
      map.removeFeatureState(getAreaTargetFeature(areaId), "fillColor");
    }
  }

  areaIdsLastUpdated.current = updatedAreaIds;
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
  chosenAreaId: string | null;
  setChosenAreaId: (id: string | null) => void;
  variableIdsToNameMap: Record<string, string>;
  variableIdsToUnitMap: Record<string, string>;
  censusYear: number;
  setChosenCensusYear: (year: number) => void;
  availableYearsForVariables: Record<string, number[]>;
};

export default function StatsMap({
  chosenAreaId,
  setChosenAreaId,
  variableIdsToNameMap,
  variableIdsToUnitMap,
  censusYear,
  setChosenCensusYear,
  availableYearsForVariables
}: StatsMapProps) {

  const mapRef = useRef<MapRef>(null);

  const [chosenVariable, setChosenVariable] = useState<string | null>(DEFAULT_CHOSEN_MAP_VARIABLE);
  const [mapStats, setMapStats] = useState<Record<string, number> | null>({});

  const areaTypeToValues = useMemo(() => getAreaTypeToValues(mapStats), [mapStats]);

  const [hoveredArea, setHoveredArea] = useState<HoveredArea | null>(null);
  const hoveredAreaStat = hoveredArea ? mapStats?.[hoveredArea.id] ?? null : null;

  const [censusYearCompareTo, setCensusYearCompareTo] = useState<number | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);

  const [chosenMapGranularity, setChosenMapGranularity] = useState<CHOSEN_MAP_GRANULARITY>("auto"); // What user has chosen
  const [autoAreaType, setAutoAreaType] = useState<AREA_TYPE>("ta"); // What auto would be
  // What is actually viewed
  const activeAreaType = chosenMapGranularity === "auto" ? autoAreaType : (chosenMapGranularity as AREA_TYPE);

  const areaIdsLastUpdated = useRef<Set<string>>(new Set()); // Is held between renders (not stateful - not causing re-renders)

  // Adding pmtiles protocol
  useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => maplibregl.removeProtocol("pmtiles");
  }, []);

  // Handling dark mode
  const colourMode = useColourMode();
  const mapColours = getMapColours(colourMode);
  const mapFlavour = useMemo(() =>
  ({ ...namedFlavor(colourMode), water: mapColours.background }),
    [colourMode, mapColours.background]
  );

  const handleMapClick = useCallback((e: MapLayerMouseEvent) => {
    const areaId = e.features?.[0]?.properties?.area_id as string | undefined;
    // Clicking empty space or the already-selected area deselects
    setChosenAreaId(areaId ?? null);
  }, [chosenAreaId, setChosenAreaId]);

  const handleMapHover = useCallback((e: MapLayerMouseEvent) => {
    const properties = e.features?.[0]?.properties;
    const areaId = properties?.area_id as string | undefined;
    setHoveredArea((prev) => {
      if (areaId) {
        if (prev?.id === areaId) {
          return prev; // No change
        }
        return { id: areaId, name: (properties?.area_name as string) ?? null };
      }
      return null;
    })
  }, []);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !hoveredArea?.id) return;
    const target = getAreaTargetFeature(hoveredArea.id);
    map.setFeatureState(target, { hover: true });
    return () => { map.setFeatureState(target, { hover: false }); };
  }, [hoveredArea?.id]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !chosenAreaId) return;
    const target = getAreaTargetFeature(chosenAreaId);
    map.setFeatureState(target, { selected: true });
    return () => { map.setFeatureState(target, { selected: false }); }; // Clean up removes past selection (is run before the next effect is run)
  }, [chosenAreaId]);

  // Update autoAreaType whenever the zoom level changes
  useEffect(() => {
    const map = mapLoaded ? mapRef.current?.getMap() ?? null : null;
    if (!map) return;
    const onZoom = () => setAutoAreaType(getAreaTypeByUsingZoomDefaults(map.getZoom()));
    onZoom(); // Set the initial value, before any zooming happens
    map.on("zoom", onZoom);
    return () => { map.off("zoom", onZoom); }; // Clean up call back, just in case it's needed
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

  const { baseLayers, placeLabelLayers } = useMemo(() => {
    const allLayers = layers(BASEMAP_SOURCE_ID, mapFlavour, { lang: "en" })
      .filter((l) => !LAYERS_TO_EXCLUDE_FROM_BASEMAP.includes(l.id));
    const isPlaceLabel = (l: { id: string }) => l.id.startsWith("places_");
    return {
      baseLayers: allLayers.filter((l) => !isPlaceLabel(l)),
      placeLabelLayers: allLayers.filter(isPlaceLabel),
    };
  }, [mapFlavour]);

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
    areaColouringEffect(mapRef, mapStats, colourScalesForAreaType, areaIdsLastUpdated);
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
          hoveredAreaName={hoveredArea?.name ?? null}
          hoveredAreaId={hoveredArea?.id ?? null}
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
          onMouseMove={handleMapHover}
          onMouseLeave={() => setHoveredArea(null)}
          onClick={(e: MapLayerMouseEvent) => handleMapClick(e)}
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
            id={BASEMAP_SOURCE_ID}
            type="vector"
            url={`pmtiles://${process.env.NEXT_PUBLIC_GCP_BUCKET_URL}/nz_basemap.pmtiles`}
          >
             {baseLayers.map((l) => <Layer key={l.id} {...l} />)}  
          </Source>

          <Source
            id={BOUNDARIES_SA2_SA3_TA_SOURCE_ID}
            type="vector"
            url={`pmtiles://${process.env.NEXT_PUBLIC_GCP_BUCKET_URL}/area_boundaries_sa2_sa3_ta.pmtiles`}
            promoteId={{ ta: "area_id", sa3: "area_id", sa2: "area_id" }} // Keys for featureIds per layer
          >
            {(["ta", "sa3", "sa2"] as const).map((id) => {
              const [minZoom, maxZoom] = getZoomRangeForLayer(id, chosenMapGranularity);
              return <AreaLayer
                key={id}
                layerId={id}
                sourceId={BOUNDARIES_SA2_SA3_TA_SOURCE_ID}
                minZoom={minZoom}
                maxZoom={maxZoom}
                colours={mapColours}
              />;
            })}
          </Source>

          <Source
            id={BOUNDARIES_SA1_SOURCE_ID}
            type="vector"
            url={`pmtiles://${process.env.NEXT_PUBLIC_GCP_BUCKET_URL}/area_boundaries_sa1.pmtiles`}
            promoteId={{ sa1: "area_id" }}
          >
            {(() => {
              // Using this trick with () allows us to a plain TS segment in TSX code
              const [minZoom, maxZoom] = getZoomRangeForLayer("sa1", chosenMapGranularity);
              return (
                <AreaLayer
                  key={"sa1"}
                  layerId={"sa1"}
                  sourceId={BOUNDARIES_SA1_SOURCE_ID}
                  minZoom={minZoom}
                  maxZoom={maxZoom}
                  colours={mapColours}
                />
              );
            })()}
          </Source>

          {placeLabelLayers.map((l) => <Layer key={l.id} {...l} />)}
        </Map>
      </Box >
    </>
  );
}