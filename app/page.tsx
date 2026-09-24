"use client";
import { Box, Icon, IconButton, Typography } from '@mui/material';
import StatsMap from './components/map/StatsMap';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import InfoPanel from './components/InfoPanel';
import { useEffect, useState } from 'react';
import TitleBar from './components/TitleBar';
import axios from 'axios';

setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

export default function Home() {
  const [chosenAreaId, setChosenAreaId] = useState<string | null>(null);

  const [variableIdsToNameMap, setVariableIdsToNameMap] = useState<Record<string, string>>({});
  const [variableIdsToUnitMap, setVariableIdToUnitMap] = useState<Record<string, string>>({});

  useEffect(() => {
    axios.get(`/api/stats/variable/ids/to-name`, { "params": { "drop_pop_vars": true } })
      .then((res) => {
        setVariableIdsToNameMap(res.data);
      });
  }, [])

  useEffect(() => {
    axios.get(`/api/stats/variable/ids/to-unit`)
      .then((res) => {
        setVariableIdToUnitMap(res.data);
      });
  }, []);

  return (
    <Box id="content">
      <TitleBar/>
      <Box id="inner-content">
        <StatsMap setChosenAreaId={setChosenAreaId} variableIdsToNameMap={variableIdsToNameMap} variableIdsToUnitMap={variableIdsToUnitMap} />
        <InfoPanel areaId={chosenAreaId} setAreaId={setChosenAreaId} variableIdsToNameMap={variableIdsToNameMap} variableIdsToUnitMap={variableIdsToUnitMap} />
        <Box className="bottom-buffer-box"></Box>
      </Box>
    </Box>
  );
}