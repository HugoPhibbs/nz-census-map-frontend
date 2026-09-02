"use client";

import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import api from "../api";

export default function InfoPanel({ areaId }: { areaId: string | null }) {
    const [areaStats, setAreaStats] = useState<Record<string, any> | null>(null);

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
        <Typography>Area ID: {areaId}</Typography>
        {areaStats && Object.entries(areaStats).map(([variable_id, variableValue]) => (
            <Typography key={variable_id}>{variable_id}: {variableValue}</Typography>
        ))}
    </Box>
}