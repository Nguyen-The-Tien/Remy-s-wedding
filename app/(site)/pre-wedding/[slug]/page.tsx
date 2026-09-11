import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AlbumScreen } from "@/screens/album"
import {
  formatMonthYearVi,
  toAlbumCardData,
  toAlbumDetailData,
} from "@/lib/albums"
import { resolveContactInfo } from "@/lib/contact"
import {
  getPublishedAlbumBySlug,
  getPublishedAlbumsByCategory,
} from "@/lib/data/albums"
import { getSiteSettings } from "@/lib/data/settings"
import { publicImageUrl } from "@/lib/r2-url"
import { buildMetadata } from "@/lib/seo"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const album = await getPublishedAlbumBySlug(slug)

  if (!album || album.category !== "pre_wedding") return {}

  return buildMetadata({
    title: `${album.title} — Remy`,
    description: `${album.location ?? ""}${
      album.event_date ? ` · ${formatMonthYearVi(album.event_date)}` : ""
    }`,
    path: `/pre-wedding/${album.slug}`,
    image: album.cover_image_key
      ? { url: publicImageUrl(album.cover_image_key) }
      : undefined,
  })
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const album = await getPublishedAlbumBySlug(slug)

  if (!album || album.category !== "pre_wedding") notFound()

  const [categoryAlbums, settings] = await Promise.all([
    getPublishedAlbumsByCategory(album.category),
    getSiteSettings(),
  ])

  const related = categoryAlbums
    .filter((a) => a.id !== album.id)
    .map(toAlbumCardData)

  return (
    <AlbumScreen
      album={toAlbumDetailData(album)}
      related={related}
      contact={resolveContactInfo(settings)}
    />
  )
}
