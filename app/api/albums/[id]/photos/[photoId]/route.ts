import { NextResponse } from "next/server"

import { updateHeroImageSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { deletePhoto, updatePhotoSortOrder } from "@/lib/data/albums"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params
  const parsed = await parseJsonBody(request, updateHeroImageSchema)
  if ("error" in parsed) return parsed.error
  const photo = await updatePhotoSortOrder(photoId, parsed.data.sortOrder)
  return NextResponse.json(photo)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params
  await deletePhoto(photoId)
  return NextResponse.json({ ok: true })
}
