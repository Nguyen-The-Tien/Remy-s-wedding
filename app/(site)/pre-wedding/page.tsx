import type { Metadata } from "next"

import { AlbumListScreen } from "@/screens/album-list"

export const metadata: Metadata = {
  title: "Pre-wedding — Remy's",
  description:
    "Trước ngày cưới, hai người được là chính mình — không kịch bản, không gượng ép.",
}

export default function Page() {
  return <AlbumListScreen category="pre_wedding" />
}
