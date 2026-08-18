import { NextResponse } from "next/server"

import { deletePhoto } from "@/lib/data/albums"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params
  await deletePhoto(photoId)
  return NextResponse.json({ ok: true })
}
