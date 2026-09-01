"use client";

import { Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import api from "../api";

export default function InfoBox({ areaId }: { areaId: string | null }) {
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
                    const variableName = row.variable_name;
                    const variableValue = row.variable_value;
                    nextAreaStats[variableName] = variableValue;
                }
                setAreaStats(nextAreaStats);
            })
    }, [areaId])

    return <Box id={"info-box"}>
        <Typography>Area ID: {areaId}</Typography>
        {areaStats && Object.entries(areaStats).map(([variableName, variableValue]) => (
            <Typography key={variableName}>{variableName}: {variableValue}</Typography>
        ))}
    </Box>
}