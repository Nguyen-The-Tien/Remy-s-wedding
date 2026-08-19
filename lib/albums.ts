import type { AlbumWithPhotos } from "@/lib/data/albums"
import { publicImageUrl } from "@/lib/r2-url"
import type { AlbumCategory, AlbumRow } from "@/lib/supabase/types"

export type { AlbumCategory }

export type AlbumCredit = { label: string; value: string }

/** Shape used everywhere an album is rendered as a card/thumbnail/link. */
export type AlbumCardData = {
  id: string
  slug: string
  category: AlbumCategory
  title: string
  location: string
  coverImage: string
}

/** Shape used by the album detail page. */
export type AlbumDetailData = {
  id: string
  slug: string
  category: AlbumCategory
  title: string
  location: string
  eventDate: string | null
  highlightVideoUrl: string | null
  photos: string[]
}

const VI_MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
]

export function formatMonthYearVi(dateIso: string) {
  const [year, month] = dateIso.split("-")
  return `${VI_MONTHS[Number(month) - 1]}, ${year}`
}

export const CATEGORY_LABEL: Record<AlbumCategory, string> = {
  pre_wedding: "Pre-wedding",
  wedding: "Wedding",
}

export const CATEGORY_TITLE: Record<AlbumCategory, string> = {
  pre_wedding: "Yêu, giữa thiên nhiên và ánh sáng",
  wedding: "Một ngày, trọn một đời",
}

export function albumHref(album: Pick<AlbumCardData, "category" | "slug">) {
  return album.category === "pre_wedding"
    ? `/pre-wedding/${album.slug}`
    : `/wedding/${album.slug}`
}

export function buildAlbumCredits(location: string): AlbumCredit[] {
  return [
    { label: "Địa điểm", value: location },
    { label: "Chụp ảnh", value: "Remy's Studio" },
    { label: "Quay phim", value: "Remy's Films (highlight)" },
    { label: "Trang phục", value: "Lộng Lẫy Bridal" },
    { label: "Trang điểm", value: "Mai Anh Makeup" },
  ]
}

export function toAlbumCardData(album: AlbumRow): AlbumCardData {
  return {
    id: album.id,
    slug: album.slug,
    category: album.category,
    title: album.title,
    location: album.location ?? "",
    coverImage: album.cover_image_key ? publicImageUrl(album.cover_image_key) : "",
  }
}

export function toAlbumDetailData(album: AlbumWithPhotos): AlbumDetailData {
  return {
    id: album.id,
    slug: album.slug,
    category: album.category,
    title: album.title,
    location: album.location ?? "",
    eventDate: album.event_date,
    highlightVideoUrl: album.highlight_video_url,
    photos: album.photos.map((photo) => publicImageUrl(photo.image_key)),
  }
}
