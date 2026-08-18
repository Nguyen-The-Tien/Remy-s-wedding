import "server-only"

import { deleteObject } from "@/lib/r2"
import { createAdminClient } from "@/lib/supabase/admin"
import { createAnonClient } from "@/lib/supabase/anon"
import type { AlbumCategory, AlbumPhotoRow, AlbumRow } from "@/lib/supabase/types"

export type AlbumWithPhotos = AlbumRow & { photos: AlbumPhotoRow[] }

// --- Public reads (anon client, RLS-restricted to published rows) ---

export async function getPublishedAlbumsByCategory(
  category: AlbumCategory
): Promise<AlbumRow[]> {
  const supabase = createAnonClient()
  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .eq("category", category)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
  if (error) throw error
  return data
}

export async function getFeaturedAlbums(): Promise<AlbumRow[]> {
  const supabase = createAnonClient()
  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .eq("is_featured", true)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
  if (error) throw error
  return data
}

export async function getPublishedAlbumBySlug(
  slug: string
): Promise<AlbumWithPhotos | null> {
  const supabase = createAnonClient()

  const { data: album, error } = await supabase
    .from("albums")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()
  if (error) throw error
  if (!album) return null

  const { data: photos, error: photosError } = await supabase
    .from("album_photos")
    .select("*")
    .eq("album_id", album.id)
    .order("sort_order", { ascending: true })
  if (photosError) throw photosError

  return { ...album, photos: photos ?? [] }
}

// --- Admin reads/writes (service-role client, bypasses RLS) ---

export async function getAlbumByIdAdmin(id: string): Promise<AlbumWithPhotos | null> {
  const supabase = createAdminClient()

  const { data: album, error } = await supabase
    .from("albums")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  if (!album) return null

  const { data: photos, error: photosError } = await supabase
    .from("album_photos")
    .select("*")
    .eq("album_id", album.id)
    .order("sort_order", { ascending: true })
  if (photosError) throw photosError

  return { ...album, photos: photos ?? [] }
}

export async function listAllAlbums(): Promise<AlbumRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function createAlbum(input: {
  category: AlbumCategory
  title: string
  slug: string
  location?: string | null
  eventDate?: string | null
}): Promise<AlbumRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("albums")
    .insert({
      category: input.category,
      title: input.title,
      slug: input.slug,
      location: input.location ?? null,
      event_date: input.eventDate ?? null,
    })
    .select("*")
    .single()
  if (error) throw error
  return data
}

export async function updateAlbum(
  id: string,
  patch: Partial<
    Pick<
      AlbumRow,
      | "title"
      | "slug"
      | "event_date"
      | "location"
      | "cover_image_key"
      | "highlight_video_url"
      | "is_featured"
      | "is_published"
      | "sort_order"
    >
  >
): Promise<AlbumRow> {
  const supabase = createAdminClient()

  let previousCoverImageKey: string | null = null
  if ("cover_image_key" in patch) {
    const { data: existing, error: fetchError } = await supabase
      .from("albums")
      .select("cover_image_key")
      .eq("id", id)
      .maybeSingle()
    if (fetchError) throw fetchError
    previousCoverImageKey = existing?.cover_image_key ?? null
  }

  const { data, error } = await supabase
    .from("albums")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error

  if (previousCoverImageKey && previousCoverImageKey !== patch.cover_image_key) {
    await deleteObject(previousCoverImageKey).catch((err) =>
      console.error("R2 cleanup failed for", previousCoverImageKey, err)
    )
  }

  return data
}

export async function deleteAlbum(id: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: photos, error: photosError } = await supabase
    .from("album_photos")
    .select("image_key")
    .eq("album_id", id)
  if (photosError) throw photosError

  const { data: album, error: albumError } = await supabase
    .from("albums")
    .select("cover_image_key")
    .eq("id", id)
    .maybeSingle()
  if (albumError) throw albumError

  const { error: deleteError } = await supabase.from("albums").delete().eq("id", id)
  if (deleteError) throw deleteError

  const keys = [
    ...(photos ?? []).map((p) => p.image_key),
    album?.cover_image_key,
  ].filter((key): key is string => Boolean(key))

  await Promise.all(
    keys.map((key) =>
      deleteObject(key).catch((err) => console.error("R2 cleanup failed for", key, err))
    )
  )
}

export async function addPhoto(
  albumId: string,
  imageKey: string,
  sortOrder: number
): Promise<AlbumPhotoRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("album_photos")
    .insert({ album_id: albumId, image_key: imageKey, sort_order: sortOrder })
    .select("*")
    .single()
  if (error) throw error
  return data
}

export async function updatePhotoSortOrder(
  photoId: string,
  sortOrder: number
): Promise<AlbumPhotoRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("album_photos")
    .update({ sort_order: sortOrder })
    .eq("id", photoId)
    .select("*")
    .single()
  if (error) throw error
  return data
}

export async function deletePhoto(photoId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: photo, error: fetchError } = await supabase
    .from("album_photos")
    .select("image_key")
    .eq("id", photoId)
    .maybeSingle()
  if (fetchError) throw fetchError

  const { error: deleteError } = await supabase
    .from("album_photos")
    .delete()
    .eq("id", photoId)
  if (deleteError) throw deleteError

  if (photo?.image_key) {
    await deleteObject(photo.image_key).catch((err) =>
      console.error("R2 cleanup failed for", photo.image_key, err)
    )
  }
}
