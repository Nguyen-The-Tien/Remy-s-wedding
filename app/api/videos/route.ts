import { NextResponse } from "next/server"

import { createVideoSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { createVideo, listVideosPageAdmin } from "@/lib/data/videos"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const pageSize = Math.max(1, Number(searchParams.get("pageSize")) || 20)

  const { videos, totalCount } = await listVideosPageAdmin(page, pageSize)
  return NextResponse.json({ videos, totalCount })
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, createVideoSchema)
  if ("error" in parsed) return parsed.error
  const video = await createVideo(parsed.data)
  return NextResponse.json(video, { status: 201 })
}
