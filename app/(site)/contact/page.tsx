import type { Metadata } from "next"

import { ContactScreen } from "@/screens/contact"
import { resolveContactInfo } from "@/lib/contact"
import { getSiteSettings } from "@/lib/data/settings"
import { buildMetadata } from "@/lib/seo"

export const metadata: Metadata = buildMetadata({
  title: "Liên hệ — Remy",
  description: "Địa chỉ studio, bản đồ và thông tin liên hệ của Remy.",
  path: "/contact",
})

export default async function Page() {
  const settings = await getSiteSettings()
  return <ContactScreen contact={resolveContactInfo(settings)} />
}
