"use client";
import { Box, Icon, IconButton, Typography } from '@mui/material';
import StatsMap from './components/map/StatsMap';
import { setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import InfoPanel from './components/InfoPanel';
import { useEffect, useState } from 'react';
import TitleBar from './components/TitleBar';
import api from "@/app/api";
import { DEFAULT_CENSUS_YEAR } from './utils';
import { Analytics } from "@vercel/analytics/next"

setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

export default function Home() {
  const [chosenAreaId, setChosenAreaId] = useState<string | null>(null);
  const [chosenCensusYear, setChosenCensusYear] = useState<number>(DEFAULT_CENSUS_YEAR);

  const [variableIdsToNameMap, setVariableIdsToNameMap] = useState<Record<string, string>>({});
  const [variableIdsToUnitMap, setVariableIdToUnitMap] = useState<Record<string, string>>({});
  const [availableYearsForVariables, setAvailableYearsForVariables] = useState<Record<string, number[]>>({});

  useEffect(() => {
    api.get(`/stats/variable/ids/to-name`, { "params": { "drop_pop_vars": true } })
      .then((res) => {
        setVariableIdsToNameMap(res.data);
      });
  }, [])

  useEffect(() => {
    api.get(`/stats/variable/ids/to-unit`)
      .then((res) => {
        setVariableIdToUnitMap(res.data);
      });
  }, []);


  useEffect(() => {
    api.get("/stats/variable/ids/to-available-years")
      .then((res) => {
        setAvailableYearsForVariables(res.data);
      })
  }, [])

  return (
    <Box id="content">
      <TitleBar />
      <Box id="inner-content">
        <StatsMap
          setChosenAreaId={setChosenAreaId}
          variableIdsToNameMap={variableIdsToNameMap}
          variableIdsToUnitMap={variableIdsToUnitMap}
          censusYear={chosenCensusYear}
          setChosenCensusYear={setChosenCensusYear}
          availableYearsForVariables={availableYearsForVariables}
        />
        <InfoPanel
          areaId={chosenAreaId}
          setAreaId={setChosenAreaId}
          variableIdsToNameMap={variableIdsToNameMap}
          variableIdsToUnitMap={variableIdsToUnitMap}
          chosenCensusYear={chosenCensusYear}
          availableYearsForVariables={availableYearsForVariables}
        />
        <Box className="bottom-buffer-box"></Box>
      </Box>
      <Analytics beforeSend={(e) => (localStorage.getItem('va-disable') ? null : e)} />
    </Box>
  );
}