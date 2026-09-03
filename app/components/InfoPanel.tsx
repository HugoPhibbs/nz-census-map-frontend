"use client";

import { Accordion, AccordionDetails, AccordionSummary, Box, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import api from "../api";
import { roundToDP } from "../utils";

const VARIABLE_GROUPS = {
    "General": [
        "pop_resident_usual",
        "median_age",
        "avg_children_born",
    ],
    "Employment": [
        "median_personal_income",
        "avg_hours_worked_per_week",
    ],
    "Ethnicities": [
        "perc_ethnicity_pacific",
        "perc_ethnicity_other",
        "perc_ethnicity_mela",
        "perc_ethnicity_maori",
        "perc_ethnicity_european",
        "perc_ethnicity_asian"
    ],
    "Birthplace": [
        "perc_birthplace_nz",
        "perc_birthplace_overseas"
    ],
}

type GroupedVariablesProps = {
    groupName: string;
    groupVariableIds: string[];
    areaVariables: Record<string, any> | null;
    variableIdsToNameMap: Record<string, string>;
};

function GroupedVariables({ groupName, groupVariableIds, areaVariables, variableIdsToNameMap }: GroupedVariablesProps) {
    return (
        <Accordion elevation={0}>
            <AccordionSummary>
                <Typography>{groupName}</Typography>
            </AccordionSummary>

            <AccordionDetails>
                <TableContainer>
                    <Table>
                        <TableBody>
                            {groupVariableIds.map((variableId) => (
                                <TableRow key={variableId}>
                                    <TableCell>{variableIdsToNameMap[variableId]}</TableCell>
                                    <TableCell>{roundToDP(areaVariables?.[variableId].variable_value, 1) ?? "N/A"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </AccordionDetails>
        </Accordion>
    )
}

export default function InfoPanel({ areaId, variableIdsToNameMap }: { areaId: string | null; variableIdsToNameMap: Record<string, string> }) {
    const [areaVariables, setAreaVariables] = useState<Record<string, any> | null>(null);
    const [areaName, setAreaName] = useState<string | null>(null);

    useEffect(() => {
        if (!areaId) {
            setAreaVariables(null);
            setAreaName(null);
            return;
        }
        const area_id_split = areaId?.split("-") ?? null;

        api.get("/area", { "params": { "area_code": area_id_split[1], "census_year": area_id_split[0] } })
            .then(res => {
                console.log(res.data)
                setAreaName(res.data["area_name"]);
            })
    }, [areaId])

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
    }, [areaId])

    return <Box id={"info-panel"}>
        {
            areaId ? (
                <>
                    <Typography component="h2" id="info-panel-title">
                        {areaName}
                    </Typography>
                    {Object.entries(VARIABLE_GROUPS).map(([groupName, groupVariableIds]) => (
                        <GroupedVariables
                            key={groupName}
                            groupName={groupName}
                            groupVariableIds={groupVariableIds}
                            areaVariables={areaVariables}
                            variableIdsToNameMap={variableIdsToNameMap}
                        />
                    ))}
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