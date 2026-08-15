"use client"

import { useState } from "react"
import Image from "next/image"

import { PhotoViewerModal } from "@/components/photo-viewer-modal"

export function PhotoLightbox({
  photos,
  title,
}: {
  photos: string[]
  title: string
}) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
        {photos.map((photo, i) => (
          <button
            key={photo}
            type="button"
            onClick={() => setSelectedPhoto(photo)}
            className="group relative aspect-[4/5] overflow-hidden bg-neutral-900"
          >
            <Image
              src={photo}
              alt={`${title} — ảnh ${i + 1}`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          </button>
        ))}
      </div>

      <PhotoViewerModal
        photo={selectedPhoto}
        title={title}
        onClose={() => setSelectedPhoto(null)}
      />
    </>
  )
}
