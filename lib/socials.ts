import { APP_CONFIG } from "@/config/config"

export const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: APP_CONFIG.contact.facebookUrl,
    icon: "/icons8-facebook.svg",
  },
  {
    label: "Zalo",
    href: APP_CONFIG.contact.zaloUrl,
    icon: "/zalo.svg",
  },
  {
    label: "Instagram",
    href: APP_CONFIG.contact.instagramUrl,
    icon: "/icons8-instagram.svg",
  },
] as const
