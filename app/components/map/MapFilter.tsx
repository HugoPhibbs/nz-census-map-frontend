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

export default function MapFilter({ chosenVariable, setChosenVariable, variableIdsToNameMap, mapGranularity, setMapGranularity }: { chosenVariable: string | null; setChosenVariable: (variable: string| null) => void; variableIdsToNameMap: Record<string, string>; mapGranularity: string | null; setMapGranularity: (granularity: string | null) => void }) {

  const [variableOptions, setVariableOptions] = useState<Record<string, string>>({});
  const [chosenVariableLocal, setChosenVariableLocal] = useState<string | null>("none");

  const ITEM_HEIGHT = 36;
  const ITEM_PADDING_TOP = 8;
  const VISIBLE_ITEMS = 8;
  const menuMaxHeight = ITEM_HEIGHT * VISIBLE_ITEMS + ITEM_PADDING_TOP;

  useEffect(() => {
    const filtered = Object.fromEntries(
      Object.entries(variableIdsToNameMap).filter(([id, _]: [any, any]) => !id.startsWith("pop_"))
    );
    setVariableOptions({ ...{"none": "None"}, ...filtered});
  }, [variableIdsToNameMap])

  const onChangeHandle = (e: any) => {
    const val = e.target.value;
    setChosenVariableLocal(val);
    if (val === "none") {
      setChosenVariable(null);
      return;
    }
    setChosenVariable(e.target.value);
  }

  return <Box id="map-filter">
    <MapFilterFormControl>
      <InputLabel id="select-variable">Display by</InputLabel>
      <Select
        value={chosenVariableLocal}
        onChange={(e) => onChangeHandle(e)}
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