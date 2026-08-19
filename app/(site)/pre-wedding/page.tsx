import type { Metadata } from "next"

import { AlbumListScreen } from "@/screens/album-list"
import { toAlbumCardData } from "@/lib/albums"
import { resolveContactInfo } from "@/lib/contact"
import { getPublishedAlbumsByCategoryPage } from "@/lib/data/albums"
import { getSiteSettings } from "@/lib/data/settings"

const PAGE_SIZE = 8

export const metadata: Metadata = {
  title: "Pre-wedding — Remy's",
  description:
    "Trước ngày cưới, hai người được là chính mình — không kịch bản, không gượng ép.",
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const [{ albums, totalCount }, settings] = await Promise.all([
    getPublishedAlbumsByCategoryPage("pre_wedding", page, PAGE_SIZE),
    getSiteSettings(),
  ])

  return (
    <AlbumListScreen
      category="pre_wedding"
      albums={albums.map(toAlbumCardData)}
      page={page}
      totalPages={Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
      contact={resolveContactInfo(settings)}
    />
  )
}
