import { NextResponse } from "next/server"

import { presignRequestSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { buildHeroImageKey, buildHeroKey, buildPhotoKey, presignUpload } from "@/lib/r2"

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, presignRequestSchema)
  if ("error" in parsed) return parsed.error
  const body = parsed.data

  const key =
    body.kind === "album-photo"
      ? buildPhotoKey(body.albumSlug, body.fileName)
      : body.kind === "hero-video"
        ? buildHeroKey(body.fileName)
        : buildHeroImageKey(body.fileName)

  const uploadUrl = await presignUpload(key, body.contentType)
  return NextResponse.json({ uploadUrl, key })
}
