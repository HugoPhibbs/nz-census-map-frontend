import "./globals.css";

import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import CssBaseline from '@mui/material/CssBaseline';
import { THEME } from './theme';

export const metadata = {
  title: "NZ Census Map",
  description: "Visualise demographic data from the NZ census with an interactive map",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" as="fetch" crossOrigin="anonymous" href="https://protomaps.github.io/basemaps-assets/fonts/Noto%20Sans%20Italic/0-255.pbf" />
        <link rel="preload" as="fetch" crossOrigin="anonymous" href="https://protomaps.github.io/basemaps-assets/fonts/Noto%20Sans%20Medium/0-255.pbf" />
        <link rel="preload" as="fetch" crossOrigin="anonymous" href="https://protomaps.github.io/basemaps-assets/fonts/Noto%20Sans%20Regular/0-255.pbf" />
        <link rel="preload" as="fetch" crossOrigin="anonymous" href="https://protomaps.github.io/basemaps-assets/fonts/Noto%20Sans%20Medium/256-511.pbf" />
      </head>
      <body>
        {/* See https://mui.com/material-ui/customization/dark-mode/ */}
        <InitColorSchemeScript attribute="class" defaultMode="light"/>
        <StyledEngineProvider injectFirst>
          <ThemeProvider theme={THEME} defaultMode="light">
            <CssBaseline />
            {children}
          </ThemeProvider>
        </StyledEngineProvider>
      </body>
    </html>
  )
}