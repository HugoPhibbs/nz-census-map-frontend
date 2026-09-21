import "./globals.css";
import { StyledEngineProvider } from '@mui/material/styles';

export const metadata = {
  title: "NZ Census Map",
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
    <html lang="en">
      <head>
        <link rel="preload" as="fetch" crossOrigin="anonymous" href="https://protomaps.github.io/basemaps-assets/fonts/Noto%20Sans%20Italic/0-255.pbf" />
        <link rel="preload" as="fetch" crossOrigin="anonymous" href="https://protomaps.github.io/basemaps-assets/fonts/Noto%20Sans%20Medium/0-255.pbf" />
        <link rel="preload" as="fetch" crossOrigin="anonymous" href="https://protomaps.github.io/basemaps-assets/fonts/Noto%20Sans%20Regular/0-255.pbf" />
        <link rel="preload" as="fetch" crossOrigin="anonymous" href="https://protomaps.github.io/basemaps-assets/fonts/Noto%20Sans%20Medium/256-511.pbf" />
      </head>
      <body>
        {/* Adding this below ensures that globals.css has precedence over MUI styles */}
        <StyledEngineProvider injectFirst>
          {children}
        </StyledEngineProvider>
      </body>
    </html>
  )
}