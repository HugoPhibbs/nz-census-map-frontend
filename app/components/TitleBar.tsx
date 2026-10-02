"use client";

import { IconButton, Link, Popover, Typography, useColorScheme, Box, SvgIconProps } from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import GitHubIcon from "@mui/icons-material/Github";
import { useState } from "react";
import InfoIcon from "./InfoIcon";

function InfoButton() {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    const {mode, setMode} = useColorScheme();
    return (
        <Box>
            <IconButton onClick={() => setMode(mode === "light" ? "dark" : "light")}>
                {mode === "light" ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>

            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <InfoIcon className="info-icon" />
            </IconButton>

            <Popover
                open={!!anchorEl}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{
                    paper: {
                        sx: { boxShadow: "none", borderRadius: "6px" },
                    },
                }}
            >
                <Box id="website-info-box">
                    <p>
                        Census data: <Link href="https://www.stats.govt.nz" target="_blank" rel="noopener"> Stats NZ</Link> <br/>
                        Map basemap: <Link href="https://docs.protomaps.com/basemaps/downloads" target="_blank" rel="noopener"> Protomaps</Link> <br/>
                        Map visuals: <Link href="https://maplibre.org/" target="_blank" rel="noopener"> MapLibre</Link> <br/>
                        Built by: <Link href="https://github.com/HugoPhibbs" target="_blank" rel="noopener"> Hugo Phibbs</Link> 
                    </p>
                </Box>
            </Popover>
        </Box>
    );
}

export default function TitleBar() {

    return (<Box id="title-bar">
        <Typography variant="h1" id="main-title">NZ Census Map</Typography>

        <Box id="title-bar-buttons-box">
            <InfoButton />
            <IconButton
                component="a"
                href="https://github.com/HugoPhibbs/nz-census-map"
                target="_blank"
                aria-label="Open GitHub repository"
            >
                <GitHubIcon />
            </IconButton>
        </Box>
    </Box>
    )
}