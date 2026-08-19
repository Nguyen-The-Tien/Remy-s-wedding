import { z } from "zod"

export const presignRequestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("album-photo"),
    fileName: z.string().min(1),
    contentType: z.string().startsWith("image/"),
    albumSlug: z.string().min(1),
  }),
  z.object({
    kind: z.literal("hero-image"),
    fileName: z.string().min(1),
    contentType: z.string().startsWith("image/"),
  }),
])

export const createAlbumSchema = z.object({
  category: z.enum(["pre_wedding", "wedding"]),
  title: z.string().min(1),
  slug: z.string().min(1),
  location: z.string().nullable().optional(),
  eventDate: z.string().nullable().optional(),
})

export const updateAlbumSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  event_date: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  cover_image_key: z.string().nullable().optional(),
  highlight_video_url: z.string().nullable().optional(),
  is_featured: z.boolean().optional(),
  is_published: z.boolean().optional(),
  sort_order: z.number().int().optional(),
})

export const addPhotoSchema = z.object({
  imageKey: z.string().min(1),
  sortOrder: z.number().int(),
})

export const createVideoSchema = z.object({
  title: z.string().min(1),
  location: z.string().min(1),
  eventDate: z.string().min(1),
  youtubeUrl: z.string().min(1),
})

export const updateVideoSchema = z.object({
  title: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  event_date: z.string().min(1).optional(),
  youtube_url: z.string().min(1).optional(),
  is_published: z.boolean().optional(),
})

export const addHeroImageSchema = z.object({
  imageKey: z.string().min(1),
  sortOrder: z.number().int(),
})

export const updateHeroImageSchema = z.object({
  sortOrder: z.number().int(),
})

export const updateSettingsSchema = z.object({
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  zalo_link: z.string().nullable().optional(),
  facebook_link: z.string().nullable().optional(),
  instagram_link: z.string().nullable().optional(),
  hero_background_mode: z.enum(["video", "images"]).optional(),
  hero_video_url: z.string().nullable().optional(),
})
