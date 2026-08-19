import type { Metadata } from "next"

import { ContactScreen } from "@/screens/contact"
import { resolveContactInfo } from "@/lib/contact"
import { getSiteSettings } from "@/lib/data/settings"

export const metadata: Metadata = {
  title: "Liên hệ — Remy's",
  description: "Địa chỉ studio, bản đồ và thông tin liên hệ của Remy's.",
}

export default async function Page() {
  const settings = await getSiteSettings()
  return <ContactScreen contact={resolveContactInfo(settings)} />
}
