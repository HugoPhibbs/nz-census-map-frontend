"use client";

import { Accordion, AccordionDetails, AccordionSummary, Box, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { formatVariableStat, formatSA1Code } from "../utils";
import { styled } from "@mui/material/styles";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

const DETAILED_VARIABLE_GROUPS = {
    "Employment": [
        ["median_personal_income"],
        ["avg_hours_worked_per_week"]
    ],
    "Ethnicities": [
        ["perc_ethnicity_pacific", "Pacific"],
        ["perc_ethnicity_other", "Other"],
        ["perc_ethnicity_mela", "MELA"],
        ["perc_ethnicity_maori", "Māori"],
        ["perc_ethnicity_european", "European"],
        ["perc_ethnicity_asian", "Asian"]
    ],
    "Birthplace": [
        ["perc_birthplace_nz"],
        ["perc_birthplace_overseas"]
    ],
    "Health": [
        ["perc_difficulty_hearing", "Difficulty hearing"],
        ["perc_difficulty_remembering_concentrating", "Difficulty remembering/concentrating"],
        ["perc_difficulty_walking", "Difficulty walking"],
        ["perc_difficulty_washing", "Difficulty washing"],
        ["perc_difficulty_seeing", "Difficulty seeing"],
        ["perc_difficulty_communicating", "Difficulty communicating"],
        ["perc_regular_smoker", "Regular smoker"]
    ]
}

const GENERAL_VARIABLE_IDS = [
    ["pop_resident_usual", "Population"],
    ["median_age"],
    ["avg_children_born", "Total fertility rate"],
]

const VariableTableCell = styled(TableCell)({
    padding: "0.2em",
});

type GroupedVariablesProps = {
    groupName: string;
    groupVariables: string[][];
    areaVariables: Record<string, any> | null;
    variableIdsToNameMap: Record<string, string>;
    variableIdsToUnitMap: Record<string, string>;
    expanded: boolean;
    onChange: any;
};

function prepareGroupVariables(groupName: string, groupVariables: string[][], areaVariables: Record<string, any> | null, variableIdsToNameMap: Record<string, string>, variableIdsToUnitMap: Record<string, string>) {
    let rows = [];
    for (const variableInfo of groupVariables) {
        const variableId = variableInfo[0];
        const variableName = variableInfo[1] ? variableInfo[1] : variableIdsToNameMap[variableId];
        const variableValue = areaVariables?.[variableId]?.variable_value ?? null;
        rows.push([variableId, variableName, variableValue]);
    }

    if (groupName === "Ethnicities") {
        rows.sort((a, b) => b[2] - a[2]);
    }

    for (let idx = 0; idx < rows.length; idx++) {
        const [variableId, _, variableValue] = rows[idx];
        const variableUnit = variableIdsToUnitMap[variableId] ?? null;
        const formattedVariableValue = formatVariableStat(variableValue, variableUnit);
        rows[idx][2] = formattedVariableValue;
    }

    return rows;
}

function GroupedVariables({ groupName, groupVariables, areaVariables, variableIdsToNameMap, variableIdsToUnitMap, expanded, onChange }: GroupedVariablesProps) {
    return (
        <Accordion elevation={0} className="grouped-variables-accordion" disableGutters onChange={onChange(groupName)} expanded={expanded}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} className="grouped-variables-accordion-summary" sx={{
                backgroundColor: "var(--title-bar-colour)",
                minHeight: "2em",
            }}>
                <Typography component={"h3"} className="grouped-variables-accordion-title"
                    sx={{ fontSize: "0.8em" }}>
                    {groupName}
                </Typography>
            </AccordionSummary>

            <AccordionDetails>
                <TableContainer>
                    <Table size="small">
                        <TableBody>
                            {prepareGroupVariables(groupName, groupVariables, areaVariables, variableIdsToNameMap, variableIdsToUnitMap).map((variableInfo) => (
                                <TableRow key={variableInfo[0]}>
                                    <VariableTableCell>{variableInfo[1]}</VariableTableCell>
                                    <VariableTableCell>{variableInfo[2]}</VariableTableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </AccordionDetails>
        </Accordion>
    )
}

function areaIdToAreaType(areaId: string | null): string | null {
    if (!areaId) return null;
    const areaCode = areaId.split("-")[1];
    if (areaCode.length === 7) {
        return "Statistical area 1";
    } else if (areaCode.length === 6) {
        return "Statistical area 2";
    } else if (areaCode.length === 5) {
        return "Statistical area 3";
    } else {
        return "Territorial authority";
    }
}

type InfoPanelProps = {
    areaId: string | null;
    variableIdsToNameMap: Record<string, string>;
    variableIdsToUnitMap: Record<string, string>;
};

export default function InfoPanel({ areaId, variableIdsToNameMap, variableIdsToUnitMap }: InfoPanelProps) {
    const [areaVariables, setAreaVariables] = useState<Record<string, any> | null>(null);
    const [areaName, setAreaName] = useState<string | null>(null);
    const [expandedGroupName, setExpandedGroupName] = useState<string | false>(false);

    useEffect(() => {
        if (!areaId) {
            setAreaVariables(null);
            setAreaName(null);
            return;
        }
        const area_id_split = areaId?.split("-") ?? null;
        const area_code = area_id_split[1];
        console.log(area_code);

        if (area_code.length == 7) { // SA1 (no names)
            setAreaName(formatSA1Code(area_code));
            return;
        }

        axios.get("/api/area", { "params": { "area_code": area_code, "census_year": area_id_split[0] } })
            .then(res => {
                console.log(res.data)
                setAreaName(res.data["area_name"]);
            })
    }, [areaId]);

    useEffect(() => {
        const areaIdSplit = areaId?.split("-") ?? null;
        if (!areaIdSplit) {
            setAreaVariables(null);
            return;
        }
        console.assert(areaIdSplit.length === 2, "Area ID should be in the format 'census_year-area_code'");
        const censusYear = parseInt(areaIdSplit[0]);
        const areaCode = areaIdSplit[1];

        axios.get("/api/stats/area",
            { "params": { "census_year": censusYear, "area_code": areaCode } })
            .then(res => {
                const newAreaVariables: Record<string, any> = {};
                for (const row of res.data) {
                    newAreaVariables[row.variable_id] = row;
                }
                setAreaVariables(newAreaVariables);
            })
    }, [areaId]);

    const handleGroupAccordionChange = (groupName: string) => (_: any, newExpanded: boolean) => {
        setExpandedGroupName(newExpanded ? groupName : false);
    };

    let generalVariables = GENERAL_VARIABLE_IDS.map((variableInfo) => ({
        variableId: variableInfo[0],
        variableName: variableInfo[1] ? variableInfo[1] : variableIdsToNameMap[variableInfo[0]],
        variableValue: areaVariables?.[variableInfo[0]]?.variable_value ?? null,
    }));

    generalVariables.push({
        variableId: "area_type",
        variableName: "Area type",
        variableValue: areaIdToAreaType(areaId),
    })

    return <Box id={"info-panel"}>
        {
            areaId ? (
                <>
                    <Typography component="h2" id="info-panel-title">
                        {areaName}
                    </Typography>
                    <TableContainer id="info-panel-general-table-container">
                        <Table size="small">
                            <TableBody>
                                {generalVariables.map((variable) => (
                                    <TableRow key={variable.variableId}>
                                        <VariableTableCell>{variable.variableName}</VariableTableCell>
                                        <VariableTableCell>{formatVariableStat(variable.variableValue, variableIdsToUnitMap[variable.variableId])}</VariableTableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box>
                        <Typography component="h3" id="info-panel-detailed-title">
                            Detailed Stats
                        </Typography>
                        {Object.entries(DETAILED_VARIABLE_GROUPS).map(([groupName, groupVariables]) => (
                            <GroupedVariables
                                key={groupName}
                                groupName={groupName}
                                groupVariables={groupVariables}
                                areaVariables={areaVariables}
                                variableIdsToNameMap={variableIdsToNameMap}
                                variableIdsToUnitMap={variableIdsToUnitMap}
                                expanded={expandedGroupName === groupName}
                                onChange={handleGroupAccordionChange}
                            />
                        ))}
                    </Box>
                </>
            ) : (
                <Box id="info-panel-hint">
                    <Typography component="h2" id="info-panel-hint-text">
                        Click an area to view details
                    </Typography>
                </Box>
            )
        }
    </Box>
}