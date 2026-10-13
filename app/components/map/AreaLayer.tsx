"use client";

import { Layer, Source } from "react-map-gl/maplibre";
import { AREA_TYPE, MapColours } from "@/app/types";
import {areaSourceId, pmtilesSourceUrl} from "./map-utils";

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
      url={pmtilesSourceUrl(`area_boundaries_${areaType}`)}
      promoteId={{ [areaType]: "area_id" }} // Key for featureIds
    >
      {/* No need to include source id when a Layer is a direct descendant of a Source */}
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
