"use client";

import { Layer, Source } from "react-map-gl/maplibre";
import { AREA_TYPE, MapColours } from "@/app/types";
import {areaSourceId} from "./map-utils";

type AreaLayerProps = {
  areaType: AREA_TYPE;
  zoomRange: [number, number];
  colours: MapColours;
};

export default function AreaLayer({ areaType, zoomRange, colours }: AreaLayerProps) {
  const [minZoom, maxZoom] = zoomRange;
  const sourceId = areaSourceId(areaType);

  return (
    <Source
      id={sourceId}
      type="vector"
      url={`pmtiles://${process.env.NEXT_PUBLIC_GCP_BUCKET_URL}/area_boundaries_${areaType}.pmtiles`}
      promoteId={{ [areaType]: "area_id" }} // Key for featureIds
    >
      <Layer
        id={`${areaType}-areas-fill`}
        type="fill"
        source-layer={areaType}
        minzoom={minZoom}
        maxzoom={maxZoom}
        paint={{
          "fill-color": [
            "coalesce",
            ["feature-state", "fillColor"],
            colours.areaFill,
          ],
          "fill-opacity": colours.areaFillOpacity,
        }}
      />

      <Layer
        id={`${areaType}-areas-border`}
        type="line"
        source-layer={areaType}
        minzoom={minZoom}
        maxzoom={maxZoom}
        paint={{
          "line-color": colours.areaBorder,
          "line-width": areaType === "sa1" ? 0.5 : 1
        }}
      />

      <Layer
        id={`${areaType}-areas-hover`}
        type="line"
        source-layer={areaType}
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
        id={`${areaType}-areas-selected`}
        type="line"
        source-layer={areaType}
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
    </Source>
  );
}
