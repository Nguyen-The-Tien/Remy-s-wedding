import { FloatingSocial } from "@/components/floating-social"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { resolveContactInfo } from "@/lib/contact"
import { getSiteSettings } from "@/lib/data/settings"

export const revalidate = 0

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getSiteSettings()
  const contact = resolveContactInfo(settings)

  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      <FloatingSocial contact={contact} />
    </>
  )
}
