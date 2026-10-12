"use client";

import { Box, FormControl, InputLabel, ListSubheader, MenuItem, Select, Button, Typography, Accordion, ToggleButton, AccordionSummary, AccordionDetails, useMediaQuery, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DEFAULT_CHOSEN_MAP_VARIABLE } from "./MapConstants";
import { AREA_TYPE_TO_NAME, DEFAULT_CENSUS_YEAR, CENSUS_YEARS } from "@/app/utils";
import { AREA_TYPE } from "@/app/types";
import EastRoundedIcon from '@mui/icons-material/EastRounded';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { CHOSEN_MAP_GRANULARITY } from "@/app/types";

const DISPLAY_BY_CATEGORIES: Record<string, string[]> = {
  "Population": [
    "pop_density"
  ],
  "Age & Family": [
    "median_age",
    "avg_children_born",
  ],
  "Employment": [
    "median_personal_income",
    "avg_hours_worked_per_week",
  ],
  "Ethnicity & descent": [
    "perc_ethnicity_european",
    "perc_ethnicity_maori",
    "perc_ethnicity_pacific",
    "perc_ethnicity_asian",
    "perc_ethnicity_mela",
    "perc_ethnicity_other",
    "perc_maori_descent",
  ],
  "Sex & Gender": [
    "perc_sex_female",
    "perc_sex_male",
    "perc_gender_female",
    "perc_gender_male",
    "perc_another_gender",
  ],
  "Birthplace & Residence": [
    "perc_birthplace_nz",
    "perc_birthplace_overseas",
    "avg_years_since_arrival_nz",
    "avg_years_at_usual_residence",
  ],
  "Health": [
    "perc_difficulty_seeing",
    "perc_difficulty_hearing",
    "perc_difficulty_walking",
    "perc_difficulty_remembering_concentrating",
    "perc_difficulty_washing",
    "perc_difficulty_communicating",
    "perc_regular_smoker",
  ],
}

function MapViewOptionsFormControl({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <FormControl className={`map-filter-dropdown ${className}`} size={"small"}>
      {children}
    </FormControl>
  )
}

type CensusYearSelectProps = {
  censusYear: number | null;
  setCensusYear: (year: number | null) => void;
  availableYearsForVariable?: number[];
  addNoneOption?: boolean;
};

function CensusYearSelect({ censusYear, setCensusYear, availableYearsForVariable, addNoneOption = false }: CensusYearSelectProps) {
  return (
    <MapViewOptionsFormControl className="census-year-select">
      <InputLabel className="map-filter-label">Year</InputLabel>
      <Select
        value={censusYear ?? "none"}
        onChange={(e) => {
          if (e.target.value === "none") {
            setCensusYear(null);
            return;
          }
          setCensusYear(e.target.value)
        }}
        label="Year..."
        className="map-filter-select"
        MenuProps={{
          slotProps: {
            paper: { className: "map-filter-menu" },
          },
        }}
      >
        {addNoneOption && <MenuItem key="none" value="none">None</MenuItem>}
        {CENSUS_YEARS.map((year) => (
          <MenuItem key={year} value={year} disabled={availableYearsForVariable && !availableYearsForVariable.includes(year)}>
            {year}
          </MenuItem>
        ))}
      </Select>
    </MapViewOptionsFormControl>
  )
}

type DisplayBySelectProps = {
  chosenVariable: string | null;
  onVariableChange: (e: any) => void;
  variableIdsToNameMap: Record<string, string>;
  chosenCensusYear: number;
  availableYearsForVariables: Record<string, number[]>;
};

function SelectVariableItem(
  variableId: string,
  variableOptions: Record<string, string>,
  availableYearsForVariables: Record<string, number[]>,
  chosenCensusYear: number
) {
  let isAvailable: boolean;
  if (variableId === "none" || Object.keys(availableYearsForVariables).length === 0) {
    isAvailable = true;
  } else {
    isAvailable = availableYearsForVariables[variableId] && availableYearsForVariables[variableId].includes(chosenCensusYear);
  }

  return (
    <MenuItem key={variableId} value={variableId} disabled={!isAvailable}>
      {`${variableOptions[variableId]}${!isAvailable ? " (N/A)" : ""}`}
    </MenuItem>
  );
}

type LockZoomButtonProps = {
  autoAreaType: AREA_TYPE;
  chosenMapGranularity: CHOSEN_MAP_GRANULARITY;
  setChosenMapGranularity: (granularity: CHOSEN_MAP_GRANULARITY) => void;
}

function LockZoomButton({
  autoAreaType,
  chosenMapGranularity,
  setChosenMapGranularity }:
  LockZoomButtonProps
) {

  const isLocked = chosenMapGranularity !== "auto";

  return (
    <Box id="lock-zoom-button-box">
      <Tooltip
        title={isLocked ? "Unlock area type to zoom" : "Lock area type to zoom"}
        placement="bottom"
        enterDelay={500}
        arrow
      >
        <ToggleButton
          value="lock"
          selected={isLocked}
          onChange={() => setChosenMapGranularity(isLocked ? "auto" : autoAreaType)}
          id="lock-zoom-button"
          size="small"
        >
          {!isLocked ? <LockIcon /> : <LockOpenIcon />}
        </ToggleButton>
      </Tooltip>
    </Box>
  )
}

function DisplayBySelect({ chosenVariable, onVariableChange, variableIdsToNameMap, chosenCensusYear, availableYearsForVariables }: DisplayBySelectProps) {
  // Hard code the default on first paint (seen immediately), also use [] so DEFAULT_CHOSEN_MAP_VARIABLE is put in literally, not as a key
  const [variableOptions, setVariableOptions] = useState<Record<string, string>>({ "none": "None", [DEFAULT_CHOSEN_MAP_VARIABLE]: "Median age" })

  const ITEM_HEIGHT = 36;
  const ITEM_PADDING_TOP = 8;
  const VISIBLE_ITEMS = 8;
  const menuMaxHeight = ITEM_HEIGHT * VISIBLE_ITEMS + ITEM_PADDING_TOP;

  useEffect(() => {
    if (Object.keys(variableIdsToNameMap).length == 0) return;

    const variableIdsToKeep = Object.values(DISPLAY_BY_CATEGORIES).flat();
    const idsToNames = Object.fromEntries(
      variableIdsToKeep.map((id) => [id, variableIdsToNameMap[id]])
    );
    setVariableOptions({ "none": "None", ...idsToNames });
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
        {SelectVariableItem("none", variableOptions, availableYearsForVariables, chosenCensusYear)}
        {/* Select doesn't accept Fragments as children, so flatten each group into a list */}
        {Object.entries(DISPLAY_BY_CATEGORIES).flatMap(([category, variableIds]) => {
          // Skip variables we don't have (yet) from the API, and any category left empty
          const shownIds = variableIds.filter((id) => id in variableOptions);
          if (shownIds.length === 0) return [];
          return [
            <ListSubheader className="display-by-category" key={`category-${category}`}>{category}</ListSubheader>,
            ...shownIds.map((id) => SelectVariableItem(id, variableOptions, availableYearsForVariables, chosenCensusYear)),
          ];
        })}
      </Select>
    </MapViewOptionsFormControl>
  )
}

type AreaTypeSelectProps = {
  chosenMapGranularity: CHOSEN_MAP_GRANULARITY;
  setChosenMapGranularity: (granularity: CHOSEN_MAP_GRANULARITY) => void;
  autoAreaType: AREA_TYPE
};

function AreaTypeSelect({ chosenMapGranularity, setChosenMapGranularity, autoAreaType }: AreaTypeSelectProps) {
  return (

    <MapViewOptionsFormControl className="area-type-select">
      <InputLabel className="map-filter-label" >Area type</InputLabel>
      <Select
        value={chosenMapGranularity ?? ''}
        onChange={(e) => e.target.value && setChosenMapGranularity(e.target.value)}
        label="Area Type...."
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

function getAvailableYearsForYearSelect(
  chosenVariable: string | null,
  availableYearsForVariables: Record<string, number[]>,
  excludeYear: number | null = null
): number[] {
  const hasVariable = chosenVariable !== null && chosenVariable !== "none";
  const years = (hasVariable && availableYearsForVariables[chosenVariable]) || CENSUS_YEARS;

  return years.filter((year) => year !== excludeYear);
}

type MapViewOptionsProps = {
  setChosenVariable: (variable: string | null) => void;
  variableIdsToNameMap: Record<string, string>;
  chosenMapGranularity: CHOSEN_MAP_GRANULARITY;
  setChosenMapGranularity: (granularity: CHOSEN_MAP_GRANULARITY) => void;
  resetZoom: () => void;
  autoAreaType: AREA_TYPE;
  chosenCensusYear: number;
  setChosenCensusYear: (year: number) => void;
  censusYearCompareTo: number | null;
  setChosenCensusYearCompareTo: (year: number | null) => void;
  availableYearsForVariables: Record<string, number[]>;
};

export default function MapViewOptions({
  setChosenVariable,
  variableIdsToNameMap,
  chosenMapGranularity,
  setChosenMapGranularity,
  resetZoom,
  autoAreaType,
  chosenCensusYear,
  setChosenCensusYear,
  censusYearCompareTo,
  setChosenCensusYearCompareTo,
  availableYearsForVariables
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
    setChosenMapGranularity("auto");
    setChosenCensusYear(DEFAULT_CENSUS_YEAR);
    setChosenCensusYearCompareTo(null);
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
            chosenCensusYear={chosenCensusYear}
            availableYearsForVariables={availableYearsForVariables}
          />

          <Box id="area-type-select-container">
            <AreaTypeSelect
              chosenMapGranularity={chosenMapGranularity}
              setChosenMapGranularity={setChosenMapGranularity}
              autoAreaType={autoAreaType}
            />
            <LockZoomButton
              autoAreaType={autoAreaType}
              chosenMapGranularity={chosenMapGranularity}
              setChosenMapGranularity={setChosenMapGranularity}
            />
          </Box>


          <Box id="census-year-selects-box">
            <CensusYearSelect
              censusYear={chosenCensusYear}
              setCensusYear={(year: number | null) => {
                if (year === null) return; // We add null type here just to satisfy TS compiling
                if (year === censusYearCompareTo) {
                  setChosenCensusYearCompareTo(null);
                }
                setChosenCensusYear(year);
              }}
              availableYearsForVariable={getAvailableYearsForYearSelect(chosenVariableLocal, availableYearsForVariables, null)}
            />
            <Box id="census-year-compare-clue">
              <EastRoundedIcon />
              Compare
            </Box>
              <CensusYearSelect
                censusYear={censusYearCompareTo}
                setCensusYear={setChosenCensusYearCompareTo}
                availableYearsForVariable={getAvailableYearsForYearSelect(chosenVariableLocal, availableYearsForVariables, chosenCensusYear)}
                addNoneOption={true}
              />
          </Box>

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
