import type { MetadataRoute } from "next"

import { APP_CONFIG } from "@/config/config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth/admin", "/api/"],
    },
    sitemap: `${APP_CONFIG.siteUrl}/sitemap.xml`,
  }
}
