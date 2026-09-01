"use client";
import { Box } from '@mui/material';
import StatsMap from './components/StatsMap';
import {Map, Source, Layer} from '@vis.gl/react-maplibre';
import {setWorkerUrl} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css'; 
import InfoBox from './components/InfoBox';
import { useState } from 'react';

setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

export default function Home() {
const [chosenAreaId, setChosenAreaId] = useState<string | null>(null);

  return (
    <Box style={{ width: "100%", height: "100vh", display: "flex" }}>
      <StatsMap chosenAreaId={chosenAreaId} setChosenAreaId={setChosenAreaId} />
      <InfoBox areaId={chosenAreaId} />
    </Box>
  )
}