import type { Metadata } from "next"

import { APP_CONFIG } from "@/config/config"
import type { ContactInfo } from "@/lib/contact"

const DEFAULT_OG_IMAGE = {
  url: "/og-banner.png",
  width: 1200,
  height: 630,
}

export function absoluteUrl(path = "/"): string {
  return new URL(path, APP_CONFIG.siteUrl).toString()
}

/** Builds per-page title/description/canonical/OG/Twitter metadata with sane defaults. */
export function buildMetadata({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
}: {
  title: string
  description: string
  path: string
  image?: { url: string; width?: number; height?: number }
}): Metadata {
  const url = absoluteUrl(path)
  const ogImage = { ...image, alt: title }

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: APP_CONFIG.name,
      type: "website",
      locale: "vi_VN",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  }
}

/** JSON-LD LocalBusiness structured data, rendered in the root layout. */
export function buildLocalBusinessJsonLd(contact: ContactInfo) {
  return {
    "@context": "https://schema.org",
    "@type": "PhotographyBusiness",
    name: APP_CONFIG.name,
    description: APP_CONFIG.description,
    url: APP_CONFIG.siteUrl,
    image: absoluteUrl(DEFAULT_OG_IMAGE.url),
    logo: absoluteUrl("/web-app-manifest-512x512.png"),
    telephone: contact.phone,
    email: contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address,
      addressCountry: "VN",
    },
    sameAs: [contact.facebookUrl, contact.instagramUrl, contact.zaloUrl].filter(
      (url) => url && new URL(url).pathname.length > 1
    ),
  }
}
