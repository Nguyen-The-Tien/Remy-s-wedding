import type { Metadata } from "next"

import { AlbumListScreen } from "@/screens/album-list"
import { toAlbumCardData } from "@/lib/albums"
import { resolveContactInfo } from "@/lib/contact"
import { getPublishedAlbumsByCategoryPage } from "@/lib/data/albums"
import { getSiteSettings } from "@/lib/data/settings"

const PAGE_SIZE = 8

export const metadata: Metadata = {
  title: "Wedding — Remy's",
  description:
    "Toàn cảnh ngày cưới, từ lễ gia tiên trang nghiêm đến tiệc mừng rộn tiếng cười.",
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const [{ albums, totalCount }, settings] = await Promise.all([
    getPublishedAlbumsByCategoryPage("wedding", page, PAGE_SIZE),
    getSiteSettings(),
  ])

  return (
    <AlbumListScreen
      category="wedding"
      albums={albums.map(toAlbumCardData)}
      page={page}
      totalPages={Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
      contact={resolveContactInfo(settings)}
    />
  )
}
