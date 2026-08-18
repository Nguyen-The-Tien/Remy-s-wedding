import { NextResponse } from "next/server"

import { updateAlbumSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { deleteAlbum, getAlbumByIdAdmin, updateAlbum } from "@/lib/data/albums"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const album = await getAlbumByIdAdmin(id)
  if (!album) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(album)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const parsed = await parseJsonBody(request, updateAlbumSchema)
  if ("error" in parsed) return parsed.error
  const album = await updateAlbum(id, parsed.data)
  return NextResponse.json(album)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await deleteAlbum(id)
  return NextResponse.json({ ok: true })
}
