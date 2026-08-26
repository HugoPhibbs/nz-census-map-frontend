"use client";

import { Box, Typography } from "@mui/material";

export default function InfoBox({ region_id}: {region_id: number | null}) {
    return <Box id ={"info-box"}>
        <Typography>Region ID: {region_id}</Typography>
    </Box>
}