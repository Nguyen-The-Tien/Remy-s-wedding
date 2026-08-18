import { NextResponse } from "next/server"

import { addHeroImageSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { addHeroImage, listHeroImages } from "@/lib/data/hero-images"

export async function GET() {
  const images = await listHeroImages()
  return NextResponse.json(images)
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, addHeroImageSchema)
  if ("error" in parsed) return parsed.error
  const image = await addHeroImage(parsed.data.imageKey, parsed.data.sortOrder)
  return NextResponse.json(image, { status: 201 })
}
