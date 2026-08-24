"use client";

import { useEffect, useState } from 'react';
import type { FeatureCollection } from 'geojson';
import * as d3 from 'd3';

export default function Map() {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [clickedId, setClickedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/regional-council-2025-clipped.json')
      .then(res => res.json())
      .then(setGeoData);
  }, []);

  if (!geoData) return <p>Loading...</p>;

  const projection = d3.geoIdentity().reflectY(true).fitSize([800, 600], geoData);
  const path = d3.geoPath(projection);

  function getFill(id: string) {
    if (clickedId === id) return '#FF6F1A';
    if (hoveredId === id) return '#FEAF45';
    return 'steelblue';
  }

  const features = [...geoData.features].sort((a, _) =>
    a.properties?.REGC2025_V === clickedId ? 1 : -1
  ); // This sorts features to ensure that the clicked features borders appears on top of its neighbours

  return (
  <svg width={800} height={600}>
    {features.map((feature) => (
      <path
        key={feature.properties?.REGC2025_V}
        d={path(feature) ?? ''}
        fill={getFill(feature.properties?.REGC2025_V)}
        stroke={feature.properties?.REGC2025_V === clickedId ? 'black' : 'white'}
        onClick={() => setClickedId(feature.properties?.REGC2025_V)}
        onMouseEnter={() => setHoveredId(feature.properties?.REGC2025_V)}
        onMouseLeave={() => setHoveredId(null)}
      />
    ))}
  </svg>
);
}