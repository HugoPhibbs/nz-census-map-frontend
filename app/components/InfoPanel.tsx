"use client";

import { Accordion, AccordionDetails, AccordionSummary, Box, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import api from "../api";
import { roundToDP, formatSA1Code } from "../utils";
import { styled } from "@mui/material/styles";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const DETAILED_VARIABLE_GROUPS = {
    "Employment": [
        ["median_personal_income"],
        ["avg_hours_worked_per_week"],
    ],
    "Ethnicities": [
        ["perc_ethnicity_pacific"],
        ["perc_ethnicity_other"],
        ["perc_ethnicity_mela"],
        ["perc_ethnicity_maori"],
        ["perc_ethnicity_european"],
        ["perc_ethnicity_asian"]
    ],
    "Birthplace": [
        ["perc_birthplace_nz"],
        ["perc_birthplace_overseas"]
    ],
}

const GENERAL_VARIABLE_IDS = [
    ["pop_resident_usual", "Population"],
    ["median_age"],
    ["avg_children_born", "Total fertility rate"],
]

type GroupedVariablesProps = {
    groupName: string;
    groupVariableIds: string[][];
    areaVariables: Record<string, any> | null;
    variableIdsToNameMap: Record<string, string>;
    expanded: boolean;
    onChange: any;
};

const VariableTableCell = styled(TableCell)({
    padding: "0.2em",
});

function formatVariableValue(variableValue: any): string {
    if (variableValue === null || variableValue === undefined) {
        return "N/A";
    }
    if (typeof variableValue === "number") {
        return roundToDP(variableValue, 1).toLocaleString();
    }
    return variableValue.toString();
}

function GroupedVariables({ groupName, groupVariableIds, areaVariables, variableIdsToNameMap, expanded, onChange }: GroupedVariablesProps) {
    return (
        <Accordion elevation={0} className="grouped-variables-accordion" disableGutters onChange={onChange(groupName)} expanded={expanded}
            sx={{
                '&:not(:last-child)': {
                    borderBottom: 0,
                },
                '&::before': {
                    display: 'none',
                },
                '&:last-of-type': {
                    borderRadius: 0, // Only way I could find to remove the bottom accordion border radius
                },
            }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} className="grouped-variables-accordion-summary" sx={{
                backgroundColor: "var(--title-bar-colour)",
                minHeight: "2em"
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
                            {groupVariableIds.map((variableInfo) => (
                                <TableRow key={variableInfo[0]}>
                                    <VariableTableCell>{variableInfo[1] ? variableInfo[1] : variableIdsToNameMap[variableInfo[0]]}</VariableTableCell>
                                    <VariableTableCell>{formatVariableValue(areaVariables?.[variableInfo[0]]?.variable_value)}</VariableTableCell>
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

export default function InfoPanel({ areaId, variableIdsToNameMap }: { areaId: string | null; variableIdsToNameMap: Record<string, string> }) {
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

        api.get("/area", { "params": { "area_code": area_code, "census_year": area_id_split[0] } })
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

        api.get("/stats/area",
            { "params": { "census_year": censusYear, "area_code": areaCode } })
            .then(res => {
                const nextAreaVariables: Record<string, any> = {};
                for (const row of res.data) {
                    nextAreaVariables[row.variable_id] = row;
                }
                setAreaVariables(nextAreaVariables);
            })
    }, [areaId]);

    const handleGroupAccordionChange = (groupName: string) => (_: any, newExpanded: boolean) => {
        setExpandedGroupName(newExpanded ? groupName : false);
    };

    let generalVariables = GENERAL_VARIABLE_IDS.map((variableInfo) => ({
        variableName: variableInfo[1] ? variableInfo[1] : variableIdsToNameMap[variableInfo[0]],
        variableValue: areaVariables?.[variableInfo[0]]?.variable_value ?? null,
    }));

    generalVariables.push({
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
                    <TableContainer>
                        <Table size="small">
                            <TableBody>
                                {generalVariables.map((variable) => (
                                    <TableRow key={variable.variableName}>
                                        <VariableTableCell>{variable.variableName}</VariableTableCell>
                                        <VariableTableCell>{formatVariableValue(variable.variableValue)}</VariableTableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box>
                        <Typography component="h3" id="info-panel-detailed-title">
                            Detailed Stats
                        </Typography>
                        {Object.entries(DETAILED_VARIABLE_GROUPS).map(([groupName, groupVariableIds]) => (
                            <GroupedVariables
                                key={groupName}
                                groupName={groupName}
                                groupVariableIds={groupVariableIds}
                                areaVariables={areaVariables}
                                variableIdsToNameMap={variableIdsToNameMap}
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