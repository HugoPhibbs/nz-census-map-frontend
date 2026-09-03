"use client";

import { Icon, IconButton, Link, Popover, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import { useState } from "react";

function InfoButton() {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

    return (
        <Box>
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Icon>
                    <img src="./info-icon.svg" alt="info icon" />
                </Icon>
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
                    <p>Built by Hugo Phibbs <br />
                        Data sourced from <Link href="https://www.stats.govt.nz" target="_blank" rel="noopener"> Stats NZ</Link> <br />
                        Maps created with <Link href="https://maplibre.org/" target="_blank" rel="noopener"> MapLibre</Link>
                    </p>
                </Box>
            </Popover>
        </Box>
    );
}

export default function TitleBar() {

    return (<Box id="title-bar">
        <Typography variant="h1" id="main-title">NZ StatMap</Typography>

        <Box id="title-bar-buttons-box">
            <InfoButton />
            <IconButton
                component="a"
                href="https://github.com/HugoPhibbs/nz-census-map"
                target="_blank"
                aria-label="Open GitHub repository"
            >
                <Icon>
                    <img src={"./github-logo.svg"} alt="GitHub Logo" />
                </Icon>
            </IconButton>
        </Box>

    </Box>
    )
}