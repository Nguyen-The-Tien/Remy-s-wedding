import { NextResponse } from "next/server"

import { createVideoSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { createVideo, listAllVideos } from "@/lib/data/videos"

export async function GET() {
  const videos = await listAllVideos()
  return NextResponse.json(videos)
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, createVideoSchema)
  if ("error" in parsed) return parsed.error
  const video = await createVideo(parsed.data)
  return NextResponse.json(video, { status: 201 })
}
