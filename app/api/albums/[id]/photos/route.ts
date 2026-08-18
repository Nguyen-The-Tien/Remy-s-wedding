import { NextResponse } from "next/server"

import { addPhotoSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { addPhoto } from "@/lib/data/albums"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const parsed = await parseJsonBody(request, addPhotoSchema)
  if ("error" in parsed) return parsed.error
  const photo = await addPhoto(id, parsed.data.imageKey, parsed.data.sortOrder)
  return NextResponse.json(photo, { status: 201 })
}
