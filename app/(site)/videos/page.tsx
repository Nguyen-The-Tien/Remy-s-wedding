import type { Metadata } from "next"

import { VideoListScreen } from "@/screens/video-list"
import { resolveContactInfo } from "@/lib/contact"
import { getSiteSettings } from "@/lib/data/settings"
import { getPublishedVideos } from "@/lib/data/videos"

export const metadata: Metadata = {
  title: "Video cưới — Remy's",
  description: "Cảm xúc, dựng thành chuyển động — toàn bộ video cưới của Remy's.",
}

export default async function Page() {
  const [videos, settings] = await Promise.all([
    getPublishedVideos(),
    getSiteSettings(),
  ])

  return <VideoListScreen videos={videos} contact={resolveContactInfo(settings)} />
}
