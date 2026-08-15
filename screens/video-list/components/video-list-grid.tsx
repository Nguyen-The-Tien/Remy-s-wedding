"use client"

import { useState } from "react"

import { AlbumThumb } from "@/components/album-thumb"
import { VideoDialogModal } from "@/components/video-dialog-modal"
import type { MockAlbum } from "@/lib/mock-albums"

export function VideoListGrid({ albums }: { albums: MockAlbum[] }) {
  const [active, setActive] = useState<MockAlbum | null>(null)

  return (
    <>
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8">
        {albums.map((album) => (
          <button
            key={album.id}
            type="button"
            onClick={() => setActive(album)}
            className="group block w-full text-left"
          >
            <AlbumThumb album={album} isVideo imageClassName="aspect-[3/4]" />
          </button>
        ))}
      </div>

      <VideoDialogModal album={active} onClose={() => setActive(null)} />
    </>
  )
}
