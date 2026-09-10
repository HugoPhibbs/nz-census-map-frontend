"use client";

import { Box, FormControl, InputLabel, MenuItem, Select, Button, Typography, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { useEffect, useState } from "react";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function MapViewOptionsFormControl({ children }) {
  return (
    <FormControl className={"map-filter-dropdown"} size={"small"}>
      {children}
    </FormControl>
  )
}

type MapViewOptionsProps = {
  setChosenVariable: (variable: string | null) => void;
  variableIdsToNameMap: Record<string, string>;
  mapGranularity: string | null;
  setMapGranularity: (granularity: string | null) => void;
  resetZoom: () => void;
};

export default function MapViewOptions({
  setChosenVariable,
  variableIdsToNameMap,
  mapGranularity,
  setMapGranularity,
  resetZoom,
}: MapViewOptionsProps) {

  const [variableOptions, setVariableOptions] = useState<Record<string, string>>({ "none": "None" });
  const [chosenVariableLocal, setChosenVariableLocal] = useState<string | null>("none");

  const ITEM_HEIGHT = 36;
  const ITEM_PADDING_TOP = 8;
  const VISIBLE_ITEMS = 8;
  const menuMaxHeight = ITEM_HEIGHT * VISIBLE_ITEMS + ITEM_PADDING_TOP;

  useEffect(() => {
    const filtered = Object.fromEntries(
      Object.entries(variableIdsToNameMap).filter(([id, _]: [any, any]) => !id.startsWith("pop_"))
    );
    setVariableOptions({ "none": "None", ...filtered });
  }, [variableIdsToNameMap])

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
  }

  return (
    <Accordion id="map-filter" >
      <AccordionSummary id="map-view-options-summary" expandIcon={<ExpandMoreIcon />}>
        <Typography component="h3">Options</Typography>
      </AccordionSummary>

      <AccordionDetails id="map-filter-details">
        <MapViewOptionsFormControl>
          <InputLabel className="map-filter-label">Display by</InputLabel>
          <Select
            value={chosenVariableLocal}
            onChange={(e) => onVariableChange(e)}
            label="Display by"
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
                  style: { maxHeight: menuMaxHeight },
                  sx: { '& .MuiMenuItem-root': { fontSize: '0.8rem' } },
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

        <MapViewOptionsFormControl>
          <InputLabel className="map-filter-label" >Area type</InputLabel>
          <Select
            value={mapGranularity ?? ''}
            onChange={(e) => e.target.value && setMapGranularity(e.target.value)}
            label="Show areas by"
            className="map-filter-select"
            MenuProps={{
              slotProps: {
                paper: {
                  sx: { '& .MuiMenuItem-root': { fontSize: '0.8rem' } },
                },
              },
            }}
          >
            <MenuItem value="auto">Auto</MenuItem>
            <MenuItem value="sa1">Statistical area 1</MenuItem>
            <MenuItem value="sa2">Statistical area 2</MenuItem>
            <MenuItem value="sa3">Statistical area 3</MenuItem>
            <MenuItem value="ta">Territorial authority</MenuItem>
          </Select>
        </MapViewOptionsFormControl>

        <Box>
          <Button
            variant="contained"
            onClick={resetView}
            id="reset-map-view-button"
          >
            Reset
          </Button>
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}