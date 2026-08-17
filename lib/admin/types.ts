import type { AlbumCategory } from "@/lib/mock-albums"

export type AdminPhoto = {
  id: string
  url: string
}

export type AdminAlbum = {
  id: string
  category: AlbumCategory
  title: string
  slug: string
  eventDate: string
  location: string
  coverImage: string
  highlightVideoUrl: string
  isFeatured: boolean
  isPublished: boolean
  createdAt: string
  photos: AdminPhoto[]
}

export type HeroBackgroundMode = "video" | "images"

export type AdminSettings = {
  email: string
  address: string
  zaloLink: string
  facebookLink: string
  instagramLink: string
  heroBackgroundMode: HeroBackgroundMode
  heroVideoUrl: string
  heroImages: AdminPhoto[]
}

export type ContactSettingsValues = Pick<
  AdminSettings,
  "email" | "address" | "zaloLink" | "facebookLink" | "instagramLink"
>

export type HeroSettingsValues = Pick<
  AdminSettings,
  "heroBackgroundMode" | "heroVideoUrl"
>

export type NewAlbumInput = {
  title: string
  category: AlbumCategory
  slug: string
  eventDate: string
}

export type AlbumFormValues = Omit<AdminAlbum, "id" | "createdAt">

export type AdminVideo = {
  id: string
  title: string
  location: string
  eventDate: string
  youtubeUrl: string
  isPublished: boolean
  createdAt: string
}

export type VideoFormValues = Pick<
  AdminVideo,
  "title" | "location" | "eventDate" | "youtubeUrl"
>
