// "use client";

// import api from "@/app/api";
// import { Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
// import { useEffect, useState } from "react";

// export default function MapFilter({ chosenVariable, setChosenVariable }: { chosenVariable: string | null; setChosenVariable: (variable: string) => void }) {

//   let [variableOptions, setVariableOptions] = useState<Record<string, string>>({});

//   useEffect(() => {
//     api.get(`/stats/variable/ids/to-name`, { "params": { "drop_pop_vars": true } })
//       .then((res) => {
//         const filtered = Object.fromEntries(
//           Object.entries(res.data).filter(([id, _]: [any, any]) => !id.startsWith("pop_"))
//         );
//         setVariableOptions(filtered as Record<string, string>);
//       });
//   }, [])

//   return <Box>
//     <FormControl id="map-filter" sx={{zIndex:1}}>
//       <InputLabel id="select-variable">Display by</InputLabel>
//       <Select value={chosenVariable ?? ''} onChange={(e) => e.target.value && setChosenVariable(e.target.value)} label="Display by">
//         {Object.entries(variableOptions).map(([key, value]) => (
//           <MenuItem key={key} value={key}>
//             {value}
//           </MenuItem>
//         ))}
//       </Select>
//     </FormControl>
//   </Box>
// }

"use client";

import api from "@/app/api";
import { Box, FormControl, InputLabel, Menu, MenuItem, Select } from "@mui/material";
import { useEffect, useState } from "react";

export default function MapFilter({ chosenVariable, setChosenVariable, variableIdsToNameMap, mapGranularity, setMapGranularity }: { chosenVariable: string | null; setChosenVariable: (variable: string) => void; variableIdsToNameMap: Record<string, string>; mapGranularity: string | null; setMapGranularity: (granularity: string | null) => void }) {

  let [variableOptions, setVariableOptions] = useState<Record<string, string>>({});

  const ITEM_HEIGHT = 48;
  const VISIBLE_ITEMS = 8;

  useEffect(() => {
    const filtered = Object.fromEntries(
      Object.entries(variableIdsToNameMap).filter(([id, _]: [any, any]) => !id.startsWith("pop_"))
    );
    setVariableOptions(filtered as Record<string, string>);
  }, [variableIdsToNameMap])

  return <Box id="map-filter">
    <FormControl id="map-variable-filter" sx={{ zIndex: 1 }}>
      <InputLabel id="select-variable">Display by</InputLabel>
      <Select
        value={chosenVariable ?? ''}
        onChange={(e) => e.target.value && setChosenVariable(e.target.value)}
        label="Display by"
      // MenuProps={{
      //   slotProps: {
      //     paper: {
      //       style: {
      //         maxHeight: ITEM_HEIGHT * VISIBLE_ITEMS + 8,
      //         width: 250,
      //       },
      //     },
      //   },
      // }}
      >
        {Object.entries(variableOptions).map(([key, value]) => (
          <MenuItem key={key} value={key}>
            {value}
          </MenuItem>
        ))}
      </Select>

    </FormControl>

    <FormControl id="map-granularity-filter" sx={{ zIndex: 1}}>
      <InputLabel id="select-granularity">Granularity</InputLabel>
      <Select
        value={mapGranularity ?? ''}
        onChange={(e) => e.target.value && setMapGranularity(e.target.value)}
        label="Show areas by"
      >
        <MenuItem value="auto">Auto</MenuItem>
        <MenuItem value="sa2">Statistical area 2</MenuItem>
        <MenuItem value="sa3">Statistical area 3</MenuItem>
        <MenuItem value="ta">Territorial authority</MenuItem>
      </Select>
    </FormControl>
  </Box>
}