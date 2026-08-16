import type { Metadata } from "next"

import { ContactScreen } from "@/screens/contact"

export const metadata: Metadata = {
  title: "Liên hệ — Remy's",
  description: "Địa chỉ studio, bản đồ và thông tin liên hệ của Remy's.",
}

export default function Page() {
  return <ContactScreen />
}
