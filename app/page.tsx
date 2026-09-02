"use client";
import { Box, Icon, IconButton } from '@mui/material';
import StatsMap from './components/map/StatsMap';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import InfoPanel from './components/InfoPanel';
import { useEffect, useState } from 'react';
import api from './api';

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
      <Box id="title-bar">
        <h1>New Zealand Census Map</h1>
        <IconButton
          component="a"
          href="https://github.com/HugoPhibbs/nz-census-map"
          target="_blank"
          aria-label="Open GitHub repository"
        >
          <Icon>
            <img src={"./github-logo.svg"} alt="GitHub Logo" />
          </Icon>
        </IconButton>
      </Box>
      <Box id="inner-content">
        <StatsMap chosenAreaId={chosenAreaId} setChosenAreaId={setChosenAreaId} variableIdsToNameMap={variableIdsToNameMap} />
        <InfoPanel areaId={chosenAreaId} variableIdsToNameMap={variableIdsToNameMap} />
      </Box>
    </Box>
  );
}