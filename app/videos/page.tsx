import type { Metadata } from "next"

import { VideoListScreen } from "@/screens/video-list"

export const metadata: Metadata = {
  title: "Video cưới — Remy's",
  description: "Cảm xúc, dựng thành chuyển động — toàn bộ video cưới của Remy's.",
}

export default function Page() {
  return <VideoListScreen />
}
