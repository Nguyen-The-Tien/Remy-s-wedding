import { NextResponse } from "next/server"

import { getAlbumStatsAdmin } from "@/lib/data/albums"
import { getVideoStatsAdmin } from "@/lib/data/videos"

function summarize(rows: { is_published: boolean }[]) {
  const published = rows.filter((r) => r.is_published).length
  return { total: rows.length, published }
}

export async function GET() {
  const [albumRows, videoRows] = await Promise.all([
    getAlbumStatsAdmin(),
    getVideoStatsAdmin(),
  ])

  return NextResponse.json({
    albums: {
      ...summarize(albumRows),
      pre_wedding: summarize(albumRows.filter((a) => a.category === "pre_wedding")),
      wedding: summarize(albumRows.filter((a) => a.category === "wedding")),
    },
    videos: summarize(videoRows),
  })
}
