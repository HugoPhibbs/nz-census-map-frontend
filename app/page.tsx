"use client";
import { Box, Icon, IconButton, Typography } from '@mui/material';
import StatsMap from './components/map/StatsMap';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import InfoPanel from './components/InfoPanel';
import { useEffect, useState } from 'react';
import api from './api';
import TitleBar from './components/TitleBar';

setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

export default function Home() {
  const [chosenAreaId, setChosenAreaId] = useState<string | null>(null);

  const [variableIdsToNameMap, setVariableIdsToNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get(`/stats/variable/ids/to-name`, { "params": { "drop_pop_vars": true } })
      .then((res) => {
        setVariableIdsToNameMap(res.data);
      });
  }, [])

  return (
    <Box id="content">
      <TitleBar/>
      <Box id="inner-content">
        <StatsMap chosenAreaId={chosenAreaId} setChosenAreaId={setChosenAreaId} variableIdsToNameMap={variableIdsToNameMap} />
        <InfoPanel areaId={chosenAreaId} variableIdsToNameMap={variableIdsToNameMap} />
      </Box>
    </Box>
  );
}