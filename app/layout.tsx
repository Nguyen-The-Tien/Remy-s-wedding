import type { Metadata } from "next"
import { EB_Garamond, Instrument_Sans } from "next/font/google"
import NextTopLoader from "nextjs-toploader"

import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { APP_CONFIG } from "@/config/config"
import { cn } from "@/lib/utils"

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
})

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} — Ảnh & Video Cưới`,
  description: APP_CONFIG.description,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        instrumentSans.variable,
        ebGaramond.variable,
        "font-sans"
      )}
    >
      <body>
        <ThemeProvider>
          <NextTopLoader showSpinner={false} color="var(--clay)" />
          {children}
          <Toaster position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
