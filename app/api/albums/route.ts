import { NextResponse } from "next/server"

import { createAlbumSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { createAlbum, listAlbumsPageAdmin } from "@/lib/data/albums"
import type { AlbumCategory } from "@/lib/supabase/types"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const pageSize = Math.max(1, Number(searchParams.get("pageSize")) || 20)
  const category = (searchParams.get("category") as AlbumCategory | null) ?? undefined

  const { albums, totalCount } = await listAlbumsPageAdmin(page, pageSize, category)
  return NextResponse.json({ albums, totalCount })
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, createAlbumSchema)
  if ("error" in parsed) return parsed.error
  const album = await createAlbum(parsed.data)
  return NextResponse.json(album, { status: 201 })
}
