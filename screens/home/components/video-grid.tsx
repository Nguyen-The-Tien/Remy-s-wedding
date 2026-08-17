"use client"

import { useState } from "react"

import { AlbumThumb } from "@/components/album-thumb"
import { VideoDialogModal } from "@/components/video-dialog-modal"
import { videoThumbnail, type VideoEntry } from "@/lib/mock-videos"

export function VideoGrid({ videos }: { videos: VideoEntry[] }) {
  const [active, setActive] = useState<VideoEntry | null>(null)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 md:gap-6">
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
                coverImage: videoThumbnail(video.youtubeUrl),
              }}
              isVideo
              imageClassName="aspect-[16/10]"
            />
          </button>
        ))}
      </div>

      <VideoDialogModal video={active} onClose={() => setActive(null)} />
    </>
  )
}
