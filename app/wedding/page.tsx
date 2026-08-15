import type { Metadata } from "next"

import { AlbumListScreen } from "@/screens/album-list"

export const metadata: Metadata = {
  title: "Wedding — Remy's",
  description:
    "Toàn cảnh ngày cưới, từ lễ gia tiên trang nghiêm đến tiệc mừng rộn tiếng cười.",
}

export default function Page() {
  return <AlbumListScreen category="wedding" />
}
