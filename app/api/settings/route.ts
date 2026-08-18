import { NextResponse } from "next/server"

import { updateSettingsSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { getSiteSettings, updateSiteSettings } from "@/lib/data/settings"

export async function GET() {
  const settings = await getSiteSettings()
  return NextResponse.json(settings)
}

export async function PATCH(request: Request) {
  const parsed = await parseJsonBody(request, updateSettingsSchema)
  if ("error" in parsed) return parsed.error
  const settings = await updateSiteSettings(parsed.data)
  return NextResponse.json(settings)
}
