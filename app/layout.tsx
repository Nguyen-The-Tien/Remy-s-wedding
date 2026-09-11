import type { Metadata, Viewport } from "next"
import { EB_Garamond, Instrument_Sans } from "next/font/google"
import NextTopLoader from "nextjs-toploader"

import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { APP_CONFIG } from "@/config/config"
import { resolveContactInfo } from "@/lib/contact"
import { getSiteSettings } from "@/lib/data/settings"
import { buildLocalBusinessJsonLd, buildMetadata } from "@/lib/seo"
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
  metadataBase: new URL(APP_CONFIG.siteUrl),
  applicationName: APP_CONFIG.name,
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  ...buildMetadata({
    title: `${APP_CONFIG.name} — Ảnh & Video Cưới`,
    description: APP_CONFIG.description,
    path: "/",
  }),
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#100D06" },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getSiteSettings()
  const jsonLd = buildLocalBusinessJsonLd(resolveContactInfo(settings))

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>
          <NextTopLoader showSpinner={false} color="var(--clay)" />
          {children}
          <Toaster position="top-right" closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
