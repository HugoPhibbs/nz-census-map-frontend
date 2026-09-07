"use client";

import api from "@/app/api";
import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { useEffect, useState } from "react";

function MapFilterFormControl({ children }) {
  return (
    <FormControl className={"map-filter-dropdown"} size={"small"}>
      {children}
    </FormControl>
  )
}

export default function MapFilter({ chosenVariable, setChosenVariable, variableIdsToNameMap, mapGranularity, setMapGranularity }: { chosenVariable: string | null; setChosenVariable: (variable: string) => void; variableIdsToNameMap: Record<string, string>; mapGranularity: string | null; setMapGranularity: (granularity: string | null) => void }) {

  let [variableOptions, setVariableOptions] = useState<Record<string, string>>({});

  const ITEM_HEIGHT = 36;
  const ITEM_PADDING_TOP = 8;
  const VISIBLE_ITEMS = 8;
  const menuMaxHeight = ITEM_HEIGHT * VISIBLE_ITEMS + ITEM_PADDING_TOP;

  useEffect(() => {
    const filtered = Object.fromEntries(
      Object.entries(variableIdsToNameMap).filter(([id, _]: [any, any]) => !id.startsWith("pop_"))
    );
    setVariableOptions(filtered as Record<string, string>);
  }, [variableIdsToNameMap])

  return <Box id="map-filter">
    <MapFilterFormControl>
      <InputLabel id="select-variable">Display by</InputLabel>
      <Select
        value={chosenVariable ?? ''}
        onChange={(e) => e.target.value && setChosenVariable(e.target.value)}
        label="Display by"
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
            },
          },
        }}
      >
        {Object.entries(variableOptions).map(([key, value]) => (
          <MenuItem key={key} value={key}>
            {value}
          </MenuItem>
        ))}
      </Select>

    </MapFilterFormControl>

    <MapFilterFormControl>
      <InputLabel id="select-granularity">Area type</InputLabel>
      <Select
        value={mapGranularity ?? ''}
        onChange={(e) => e.target.value && setMapGranularity(e.target.value)}
        label="Show areas by"
        className="map-filter-select"
      >
        <MenuItem value="auto">Auto</MenuItem>
        <MenuItem value="sa1">Statistical area 1</MenuItem>
        <MenuItem value="sa2">Statistical area 2</MenuItem>
        <MenuItem value="sa3">Statistical area 3</MenuItem>
        <MenuItem value="ta">Territorial authority</MenuItem>
      </Select>
    </MapFilterFormControl>
  </Box>
}