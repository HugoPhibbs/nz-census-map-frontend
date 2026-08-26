"use client";
import { Box } from '@mui/material';
import RegionalMap from './components/RegionalMap';
import {Map, Source, Layer} from '@vis.gl/react-maplibre';
import {setWorkerUrl} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css'; 
import InfoBox from './components/InfoBox';
import { useState } from 'react';

setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

export default function Home() {
const [chosenRegionId, setChosenRegionId] = useState<number | null>(null);

  return (
    <Box style={{ width: "100%", height: "100vh", display: "flex" }}>
      <RegionalMap setChosenRegionId={setChosenRegionId} />
      <InfoBox region_id={chosenRegionId} />
    </Box>
  )
}