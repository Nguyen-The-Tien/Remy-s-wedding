import { NextResponse } from "next/server"

import { updateHeroImageSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { deleteHeroImage, updateHeroImageSortOrder } from "@/lib/data/hero-images"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const parsed = await parseJsonBody(request, updateHeroImageSchema)
  if ("error" in parsed) return parsed.error
  const image = await updateHeroImageSortOrder(id, parsed.data.sortOrder)
  return NextResponse.json(image)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await deleteHeroImage(id)
  return NextResponse.json({ ok: true })
}
