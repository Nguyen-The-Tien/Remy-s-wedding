import "server-only"

import { deleteObject } from "@/lib/r2"
import { createAdminClient } from "@/lib/supabase/admin"
import { createAnonClient } from "@/lib/supabase/anon"
import type { HeroImageRow } from "@/lib/supabase/types"

// --- Public reads (anon client — always public, no per-row publish flag) ---

export async function listHeroImages(): Promise<HeroImageRow[]> {
  const supabase = createAnonClient()
  const { data, error } = await supabase
    .from("hero_images")
    .select("*")
    .order("sort_order", { ascending: true })
  if (error) throw error
  return data
}

// --- Admin reads/writes (service-role client, bypasses RLS) ---

export async function addHeroImage(
  imageKey: string,
  sortOrder: number
): Promise<HeroImageRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("hero_images")
    .insert({ image_key: imageKey, sort_order: sortOrder })
    .select("*")
    .single()
  if (error) throw error
  return data
}

export async function updateHeroImageSortOrder(
  id: string,
  sortOrder: number
): Promise<HeroImageRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("hero_images")
    .update({ sort_order: sortOrder })
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return data
}

export async function deleteHeroImage(id: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: image, error: fetchError } = await supabase
    .from("hero_images")
    .select("image_key")
    .eq("id", id)
    .maybeSingle()
  if (fetchError) throw fetchError

  const { error: deleteError } = await supabase.from("hero_images").delete().eq("id", id)
  if (deleteError) throw deleteError

  if (image?.image_key) {
    await deleteObject(image.image_key).catch((err) =>
      console.error("R2 cleanup failed for", image.image_key, err)
    )
  }
}
