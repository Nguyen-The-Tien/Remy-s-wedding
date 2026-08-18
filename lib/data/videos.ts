import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { createAnonClient } from "@/lib/supabase/anon"
import type { VideoRow } from "@/lib/supabase/types"

// --- Public reads (anon client, RLS-restricted to published rows) ---

export async function getPublishedVideos(): Promise<VideoRow[]> {
  const supabase = createAnonClient()
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

// --- Admin reads/writes (service-role client, bypasses RLS) ---

export async function listAllVideos(): Promise<VideoRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function createVideo(input: {
  title: string
  location: string
  eventDate: string
  youtubeUrl: string
}): Promise<VideoRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("videos")
    .insert({
      title: input.title,
      location: input.location,
      event_date: input.eventDate,
      youtube_url: input.youtubeUrl,
    })
    .select("*")
    .single()
  if (error) throw error
  return data
}

export async function updateVideo(
  id: string,
  patch: Partial<
    Pick<VideoRow, "title" | "location" | "event_date" | "youtube_url" | "is_published">
  >
): Promise<VideoRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("videos")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return data
}

export async function deleteVideo(id: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("videos").delete().eq("id", id)
  if (error) throw error
}
