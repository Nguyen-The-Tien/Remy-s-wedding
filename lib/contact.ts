import { APP_CONFIG } from "@/config/config"
import type { SocialUrls } from "@/lib/socials"
import type { SiteSettingsRow } from "@/lib/supabase/types"

export type ContactInfo = SocialUrls & {
  email: string
  address: string
  phone: string
}

export function resolveContactInfo(settings: SiteSettingsRow): ContactInfo {
  return {
    email: settings.email || APP_CONFIG.contact.email,
    address: settings.address || APP_CONFIG.contact.address,
    phone: settings.phone || APP_CONFIG.contact.phone,
    facebookUrl: settings.facebook_link || APP_CONFIG.contact.facebookUrl,
    zaloUrl: settings.zalo_link || APP_CONFIG.contact.zaloUrl,
    instagramUrl: settings.instagram_link || APP_CONFIG.contact.instagramUrl,
  }
}
