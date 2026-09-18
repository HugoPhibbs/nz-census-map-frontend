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
      <body> 
        {/* Adding this below ensures that globals.css has precedence over MUI styles */}
        <StyledEngineProvider injectFirst>
          {children}
        </StyledEngineProvider> 
      </body>
    </html>
  )
}