"use client"

import { useState } from "react"

import { AlbumThumb } from "@/components/album-thumb"
import { VideoDialogModal } from "@/components/video-dialog-modal"
import { videoThumbnail } from "@/lib/videos"
import type { VideoRow } from "@/lib/supabase/types"

export function VideoListGrid({ videos }: { videos: VideoRow[] }) {
  const [active, setActive] = useState<VideoRow | null>(null)

  return (
    <>
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8">
        {videos.map((video) => (
          <button
            key={video.id}
            type="button"
            onClick={() => setActive(video)}
            className="group block w-full text-left"
          >
            <AlbumThumb
              album={{
                title: video.title,
                location: video.location,
                coverImage: videoThumbnail(video.youtube_url),
              }}
              isVideo
              imageClassName="aspect-[3/4]"
            />
          </button>
        ))}
      </div>

      <VideoDialogModal video={active} onClose={() => setActive(null)} />
    </>
  )
}
