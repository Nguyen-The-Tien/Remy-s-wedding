import { NextResponse } from "next/server"

import { createAlbumSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { createAlbum, listAllAlbums } from "@/lib/data/albums"

export async function GET() {
  const albums = await listAllAlbums()
  return NextResponse.json(albums)
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, createAlbumSchema)
  if ("error" in parsed) return parsed.error
  const album = await createAlbum(parsed.data)
  return NextResponse.json(album, { status: 201 })
}
