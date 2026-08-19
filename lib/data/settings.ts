import "server-only"

import { cache } from "react"

import { createAdminClient } from "@/lib/supabase/admin"
import { createAnonClient } from "@/lib/supabase/anon"
import type { SiteSettingsRow } from "@/lib/supabase/types"

export const getSiteSettings = cache(async (): Promise<SiteSettingsRow> => {
  const supabase = createAnonClient()
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single()
  if (error) throw error
  return data
})

export async function updateSiteSettings(
  patch: Partial<
    Pick<
      SiteSettingsRow,
      | "email"
      | "address"
      | "phone"
      | "zalo_link"
      | "facebook_link"
      | "instagram_link"
      | "hero_background_mode"
      | "hero_video_url"
    >
  >
): Promise<SiteSettingsRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("site_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("*")
    .single()
  if (error) throw error
  return data
}
