import type { Metadata } from "next"

import { VideoListScreen } from "@/screens/video-list"
import { resolveContactInfo } from "@/lib/contact"
import { getSiteSettings } from "@/lib/data/settings"
import { getPublishedVideosPage } from "@/lib/data/videos"

const PAGE_SIZE = 8

export const metadata: Metadata = {
  title: "Video cưới — Remy's",
  description: "Cảm xúc, dựng thành chuyển động — toàn bộ video cưới của Remy's.",
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)

  const [{ videos, totalCount }, settings] = await Promise.all([
    getPublishedVideosPage(page, PAGE_SIZE),
    getSiteSettings(),
  ])

  return (
    <VideoListScreen
      videos={videos}
      page={page}
      totalPages={Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
      contact={resolveContactInfo(settings)}
    />
  )
}
