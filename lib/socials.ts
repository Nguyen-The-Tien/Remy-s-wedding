export type SocialUrls = {
  facebookUrl: string
  zaloUrl: string
  instagramUrl: string
}

export function buildSocialLinks(urls: SocialUrls) {
  return [
    { label: "Facebook", href: urls.facebookUrl, icon: "/icons8-facebook.svg" },
    { label: "Zalo", href: urls.zaloUrl, icon: "/zalo.svg" },
    { label: "Instagram", href: urls.instagramUrl, icon: "/icons8-instagram.svg" },
  ] as const
}
