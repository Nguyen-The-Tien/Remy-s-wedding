import type { MetadataRoute } from "next"

import { APP_CONFIG } from "@/config/config"
import { getAllPublishedAlbumsForSitemap } from "@/lib/data/albums"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const albums = await getAllPublishedAlbumsForSitemap()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${APP_CONFIG.siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    {
      url: `${APP_CONFIG.siteUrl}/wedding`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_CONFIG.siteUrl}/pre-wedding`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${APP_CONFIG.siteUrl}/videos`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${APP_CONFIG.siteUrl}/contact`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ]

  const albumRoutes: MetadataRoute.Sitemap = albums.map((album) => ({
    url: `${APP_CONFIG.siteUrl}/${album.category === "pre_wedding" ? "pre-wedding" : "wedding"}/${album.slug}`,
    lastModified: album.updated_at,
    changeFrequency: "monthly",
    priority: 0.7,
  }))

  return [...staticRoutes, ...albumRoutes]
}
