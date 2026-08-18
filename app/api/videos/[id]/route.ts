import { NextResponse } from "next/server"

import { updateVideoSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { deleteVideo, updateVideo } from "@/lib/data/videos"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const parsed = await parseJsonBody(request, updateVideoSchema)
  if ("error" in parsed) return parsed.error
  const video = await updateVideo(id, parsed.data)
  return NextResponse.json(video)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await deleteVideo(id)
  return NextResponse.json({ ok: true })
}
