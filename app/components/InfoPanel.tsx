"use client";

import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import api from "../api";

export default function InfoPanel({ areaId, variableIdsToNameMap }: { areaId: string | null; variableIdsToNameMap: Record<string, string> }) {
    const [areaStats, setAreaStats] = useState<Record<string, any> | null>(null);
    const [areaName, setAreaName] = useState<string | null>(null);

    useEffect(() => {
        if (!areaId) {
            setAreaStats(null);
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
            setAreaStats(null);
            return;
        }
        console.assert(areaIdSplit.length === 2, "Area ID should be in the format 'census_year-area_code'");
        const censusYear = parseInt(areaIdSplit[0]);
        const areaCode = areaIdSplit[1];

        api.get("/stats/area",
            { "params": { "census_year": censusYear, "area_code": areaCode } })
            .then(res => {
                const nextAreaStats: Record<string, any> = {};
                for (const row of res.data) {
                    const variable_id = row.variable_id;
                    const variableValue = row.variable_value;
                    nextAreaStats[variable_id] = variableValue;
                }
                setAreaStats(nextAreaStats);
            })
    }, [areaId])

    return <Box id={"info-box"}>
        <Typography component="h2">{areaName}</Typography>
        {areaStats && Object.entries(areaStats).map(([variable_id, variableValue]) => (
            <Typography key={variable_id}>{variableIdsToNameMap[variable_id]}: {variableValue}</Typography>
        ))}
    </Box>
}