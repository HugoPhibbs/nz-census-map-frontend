"use client";

import { Box, FormControl, InputLabel, MenuItem, Select, Button, Typography, Accordion, AccordionSummary, AccordionDetails, useMediaQuery } from "@mui/material";
import { useEffect, useState } from "react";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DEFAULT_CHOSEN_MAP_VARIABLE, ZOOM_RANGES} from "./MapConstants";
import {AREA_TYPE_TO_NAME, AREA_TYPE, DEFAULT_CENSUS_YEAR, CENSUS_YEARS} from "@/app/utils";

function getAreaTypeForZoom(zoomLevel: number): AREA_TYPE {
  for (const [areaType, [minZoom, maxZoom]] of Object.entries(ZOOM_RANGES)) {
    if (zoomLevel >= minZoom && zoomLevel < maxZoom) {
      return areaType as AREA_TYPE;
    }
  }
  console.warn(`Zoom level ${zoomLevel} does not correspond to any area type`);
  return "ta"; // Default
}

function MapViewOptionsFormControl({ children }: { children: React.ReactNode }) {
  return (
    <FormControl className={"map-filter-dropdown"} size={"small"}>
      {children}
    </FormControl>
  )
}

type DisplayBySelectProps = {
  chosenVariable: string | null;
  onVariableChange: (e: any) => void;
  variableIdsToNameMap: Record<string, string>;
};

function CensusYearSelect({ chosenCensusYear, setChosenCensusYear }: { chosenCensusYear: number; setChosenCensusYear: (year: number) => void }) {
  return (
    <MapViewOptionsFormControl>
      <InputLabel className="map-filter-label">Census year</InputLabel>
      <Select
        value={chosenCensusYear}
        onChange={(e) => setChosenCensusYear(e.target.value)}
        label="Census year"
        className="map-filter-select"
        MenuProps={{
          slotProps: {
            paper: {className: "map-filter-menu"},
          },
        }}
      >
        {CENSUS_YEARS.map((year) => (
          <MenuItem key={year} value={year}>
            {year}
          </MenuItem>
        ))}
      </Select>
    </MapViewOptionsFormControl>
  )
}

function DisplayBySelect({ chosenVariable, onVariableChange, variableIdsToNameMap }: DisplayBySelectProps) {
  const [variableOptions, setVariableOptions] = useState<Record<string, string>>({ "none": "None", [DEFAULT_CHOSEN_MAP_VARIABLE]: "Median age" }); // Hard code in so its here on first paint

  const ITEM_HEIGHT = 36;
  const ITEM_PADDING_TOP = 8;
  const VISIBLE_ITEMS = 8;
  const menuMaxHeight = ITEM_HEIGHT * VISIBLE_ITEMS + ITEM_PADDING_TOP;

  useEffect(() => {
    if (Object.keys(variableIdsToNameMap).length == 0) return;
    const filtered = Object.fromEntries(
      Object.entries(variableIdsToNameMap).filter(([id, _]: [any, any]) => !id.startsWith("pop_"))
    );
    setVariableOptions({ "none": "None", ...filtered });
  }, [variableIdsToNameMap])

  return (
    <MapViewOptionsFormControl>
      <InputLabel className="map-filter-label">Display by</InputLabel>
      <Select
        value={chosenVariable}
        onChange={(e) => onVariableChange(e)}
        label="Display by...." // Adding trailing dots makes the notch big enough
        defaultValue="none"
        className="map-filter-select"
        MenuProps={{
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "left",
          },
          transformOrigin: {
            vertical: "top",
            horizontal: "left",
          },
          slotProps: {
            paper: {
              className: "map-filter-menu",
              style: { maxHeight: menuMaxHeight }
            },
          },
        }}
      >
        {Object.entries(variableOptions).map(([option_key, label]) => (
          <MenuItem key={option_key} value={option_key}>
            {label}
          </MenuItem>
        ))}
      </Select>
    </MapViewOptionsFormControl>
  )
}

type AreaTypeSelectProps = {
  mapGranularity: string | null;
  setMapGranularity: (granularity: string | null) => void;
  map: any
};

function AreaTypeSelect({ mapGranularity, setMapGranularity, map }: AreaTypeSelectProps) {
  const [autoAreaType, setAutoAreaType] = useState<AREA_TYPE>("ta");

  useEffect(() => {
    if (!map) return;
    const onZoom = () => setAutoAreaType(getAreaTypeForZoom(map.getZoom()));
    map.on("zoom", onZoom);
    return () => { map.off("zoom", onZoom); }; // Clean up call back
  }, [map]);

  return (
    <MapViewOptionsFormControl>
      <InputLabel className="map-filter-label" >Area type</InputLabel>
      <Select
        value={mapGranularity ?? ''}
        onChange={(e) => e.target.value && setMapGranularity(e.target.value)}
        label="Area type...."
        className="map-filter-select"
        MenuProps={{
          slotProps: {
            paper: { className: "map-filter-menu" }
          },
        }}
      >
        <MenuItem value="auto">{`Auto (${AREA_TYPE_TO_NAME[autoAreaType]})`}</MenuItem>
        <MenuItem value="ta">{AREA_TYPE_TO_NAME["ta"]}</MenuItem>
        <MenuItem value="sa3">{AREA_TYPE_TO_NAME["sa3"]}</MenuItem>
        <MenuItem value="sa2">{AREA_TYPE_TO_NAME["sa2"]}</MenuItem>
        <MenuItem value="sa1">{AREA_TYPE_TO_NAME["sa1"]}</MenuItem>
      </Select>
    </MapViewOptionsFormControl>
  )
}

type MapViewOptionsProps = {
  setChosenVariable: (variable: string | null) => void;
  variableIdsToNameMap: Record<string, string>;
  mapGranularity: string | null;
  setMapGranularity: (granularity: string | null) => void;
  resetZoom: () => void;
  map: any
  setChosenCensusYear: (year: number) => void;
  chosenCensusYear: number;
};

export default function MapViewOptions({
  setChosenVariable,
  variableIdsToNameMap,
  mapGranularity,
  setMapGranularity,
  resetZoom,
  map,
  setChosenCensusYear,
  chosenCensusYear
}: MapViewOptionsProps) {

  const [chosenVariableLocal, setChosenVariableLocal] = useState<string | null>(DEFAULT_CHOSEN_MAP_VARIABLE);

  const isPhone = useMediaQuery('(max-width:600px)');

  const onVariableChange = (e: any) => {
    const val = e.target.value;
    setChosenVariableLocal(val);
    if (val === "none") {
      setChosenVariable(null);
      return;
    }
    setChosenVariable(e.target.value);
  }

  const resetView = () => {
    resetZoom();
    setChosenVariable(null);
    setChosenVariableLocal("none");
    setMapGranularity("auto");
    setChosenCensusYear(DEFAULT_CENSUS_YEAR);
  }

  return (
    <Accordion id="map-filter" defaultExpanded={!isPhone}>
      <AccordionSummary id="map-view-options-summary" expandIcon={<ExpandMoreIcon />}>
        <Typography component="h3" id="map-view-options-title">Map options</Typography>
      </AccordionSummary>

      <AccordionDetails id="map-filter-details">
        <Box id="map-filter-formcontrols-box">
          <DisplayBySelect
            chosenVariable={chosenVariableLocal}
            onVariableChange={onVariableChange}
            variableIdsToNameMap={variableIdsToNameMap}
          />
          <AreaTypeSelect
            mapGranularity={mapGranularity}
            setMapGranularity={setMapGranularity}
            map={map}
          />
          <CensusYearSelect
            chosenCensusYear={chosenCensusYear}
            setChosenCensusYear={setChosenCensusYear}
          />
        </Box>

        <Box>
          <Button
            variant="contained"
            onClick={resetView}
            id="reset-map-view-button"
            className={"rounded-button"}
          >
            Reset
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}
