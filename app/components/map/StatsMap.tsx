"use client";

import { Box } from "@mui/material";
import { Protocol } from "pmtiles";
import { useEffect, useRef, useState } from "react";

import { scaleSequential } from "d3-scale";
import { interpolatePlasma } from "d3-scale-chromatic";
import * as maplibregl from 'maplibre-gl';
import { MapLayerMouseEvent, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Layer, MapRef, Source, AttributionControl } from "react-map-gl/maplibre";
import api from "../../api";
import AreaLayer from "./AreaLayer";
import MAP_COLOURS from "./MapColours";
import MapFilter from "./MapFilter";
import MapInfoBox from "./MapInfoBox";

setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

type DBRow = Record<string, string | number>;

const MAP_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [{ id: "background", type: "background" as const, paint: { "background-color": MAP_COLOURS["background"] } }],
};

const INTERACTIVE_LAYERS = ["ta-areas-fill", "sa3-areas-fill", "sa2-areas-fill"];


function updateMapStatsEffect(chosenVariable: any, setMapStats: any, setMinVariableValue: any, setMaxVariableValue: any) {
  const CENSUS_YEAR = 2023; // Set as a constant for now.

  if (chosenVariable) {
    api.get(`/stats/variable/${chosenVariable}/${CENSUS_YEAR}`)
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

function setHoveredFeature(e: MapLayerMouseEvent, mapRef: any, hoveredFeature: any, clearHover: () => void) {
  const feature = e.features?.[0];
  const map = mapRef.current?.getMap();
  if (!map) return;

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

  const colorScale = scaleSequential(interpolatePlasma)
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

  const clearHover = () => {
    const map = mapRef.current?.getMap();
    if (map && hoveredFeature.current) {
      map.setFeatureState(hoveredFeature.current, { hover: false });
    }
    hoveredFeature.current = null;
    setHoveredAreaId(null);
    setHoveredAreaName(null);
    setHoveredAreaStat(null);
  };

  const handleMapHover = (e: MapLayerMouseEvent) => {
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
    setHoveredAreaName((feature?.properties?.area_name as string) ?? null); // or whatever name field you actually want
    setHoveredAreaStat(areaId ? mapStats?.[areaId]?.variable_value as number ?? null : null);
  };

  useEffect(() => {
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => maplibregl.removeProtocol("pmtiles");
  }, []);

  useEffect(() => {
    api.get(`/stats/variable/ids/to-unit`)
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
    "ta": [undefined, 6],
    "sa3": [6, 8],
    "sa2": [8, undefined],
  }

  const getZoomRangeForLayer = (layerId: string) => {
    if (mapGranularity === "auto") return ZOOM_RANGES[layerId];
    return (mapGranularity === layerId ? [0, 24] : [24, 24]);
  }

  return (
    <>

      <Box id={"stats-map"}>
        <MapFilter chosenVariable={chosenVariable} setChosenVariable={setChosenVariable} variableIdsToNameMap={variableIdsToNameMap} mapGranularity={mapGranularity} setMapGranularity={setMapGranularity} />

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
          initialViewState={{ longitude: 174, latitude: -41, zoom: 4.5 }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={MAP_STYLE}
          interactiveLayerIds={INTERACTIVE_LAYERS}
          onMouseMove={(e: MapLayerMouseEvent) => handleMapHover(e)}
          onMouseLeave={clearHover}
          onClick={(e: MapLayerMouseEvent) => handleMapClick(e, mapRef, selectedFeature, setChosenAreaId)}
          cursor="pointer"
          attributionControl={false}
        >
          <Source
            id="areas"
            type="vector"
            url={`pmtiles://${process.env.NEXT_PUBLIC_API_HOST}/area-boundaries.pmtiles`}
            promoteId={{ ta: "area_id", sa3: "area_id", sa2: "area_id" }}
            maxzoom={11}
          >
            <Layer id="base-fill" type="fill" source="areas" source-layer="coastline"
              paint={{ "fill-color": MAP_COLOURS["areaFill"], "fill-opacity": 0.8 }} />
            <AreaLayer layerId="ta" maxZoom={6} chosenAreaId={chosenAreaId} />
              <AreaLayer layerId="sa3" minZoom={6} maxZoom={8} chosenAreaId={chosenAreaId} />
              <AreaLayer layerId="sa2" minZoom={8} chosenAreaId={chosenAreaId} />

            {(["ta", "sa3", "sa2"] as const).map((id) => {
              const [minZoom, maxZoom] = getZoomRangeForLayer(id);
              return <AreaLayer key={id} layerId={id} chosenAreaId={chosenAreaId} minZoom={minZoom} maxZoom={maxZoom} />;
            })}
          </Source>
        </Map>
      </Box>
    </>
  );
}