"use client";

import { useEffect, useState } from "react";
import Map, { Source, Layer } from "react-map-gl/maplibre";
import type { FeatureCollection } from "geojson";
import {setWorkerUrl} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css'; 

setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

export default function RegionalMap() {
  const [geoData, setGeoData] =
    useState<FeatureCollection | null>(null);

  useEffect(() => {
    fetch("/regional-council-2025-clipped.json")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched GeoJSON data:", data);
        setGeoData(data);
      })
      .catch((e) => {
        console.log("Error fetching GeoJSON data", e);
      });
  }, []);

  return (
    <div style={{ width: "800px", height: "600px" }}>
      <Map
        initialViewState={{
          longitude: 174,
          latitude: -41,
          zoom: 4.5,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={{
          version: 8,
          sources: {},
          layers: [
            {
              id: "background",
              type: "background",
              paint: {
                "background-color": "#dddddd",
              },
            },
          ],
        }}
      >
        {geoData && (
          <Source
            id="regions"
            type="geojson"
            data={geoData}
          >
            <Layer
              id="regions-fill"
              type="fill"
              paint={{
                "fill-color": "steelblue",
                "fill-opacity": 0.8,
              }}
            />

            <Layer
              id="regions-border"
              type="line"
              paint={{
                "line-color": "white",
                "line-width": 1,
              }}
            />
          </Source>
        )}
      </Map>

      {/* <Map
        initialViewState={{
          longitude: 174,
          latitude: -41,
          zoom: 4.5,
        }}
        style={{ width: 800, height: 600 }}
        mapStyle="https://demotiles.maplibre.org/style.json"
      >
        {/* {geoData && (
          <Source
            id="regions"
            type="geojson"
            data={geoData}
          >
            <Layer
              id="regions"
              type="fill"
              paint={{
                "fill-color": "#ff0000",
                "fill-opacity": 1,
              }}
            />
          </Source>
        )} */}

        {/* <Source
          id="test"
          type="geojson"
          data={{
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [[
                [174, -41],
                [175, -41],
                [175, -40],
                [174, -40],
                [174, -41],
              ]],
            },
            properties: {},
          }}
        >
          <Layer
            id="test-fill"
            type="fill"
            paint={{
              "fill-color": "#ff0000",
              "fill-opacity": 1,
            }}
          />
        </Source>
      </Map>  */}
    </div>
  );
}