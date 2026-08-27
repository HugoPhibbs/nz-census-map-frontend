"use client";

import { Box, Typography } from "@mui/material";

export default function InfoBox({ areaId }: { areaId: number | null }) {
    return <Box id ={"info-box"}>
        <Typography>Area ID: {areaId}</Typography>
    </Box>
}