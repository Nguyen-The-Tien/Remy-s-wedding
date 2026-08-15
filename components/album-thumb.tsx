import Image from "next/image"
import { Play } from "lucide-react"

import { cn } from "@/lib/utils"
import type { MockAlbum } from "@/lib/mock-albums"

export function AlbumThumb({
  album,
  isVideo,
  imageClassName,
}: {
  album: MockAlbum
  isVideo?: boolean
  imageClassName?: string
}) {
  return (
    <figure>
      <div
        className={cn(
          "relative w-full overflow-hidden bg-neutral-900 transition-shadow duration-500 group-hover:shadow-xl",
          imageClassName
        )}
      >
        <Image
          src={album.coverImage}
          alt={`Album ${album.title} — ${album.location}`}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 80vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        {isVideo && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-12 items-center justify-center rounded-full border border-white/50 bg-black/20 backdrop-blur-sm transition-transform duration-500 group-hover:scale-110">
              <Play className="size-4 fill-white text-white" />
            </span>
          </span>
        )}
      </div>
      <figcaption className="pt-3">
        <p className="inline-block font-serif text-lg text-foreground transition-colors duration-300 group-hover:text-clay">
          {album.title}
          <span className="mt-1 block h-px w-0 bg-clay transition-all duration-500 ease-out group-hover:w-full" />
        </p>
        <p className="mt-1.5 text-[0.68rem] font-medium tracking-[0.14em] text-clay uppercase">
          {album.location}
        </p>
      </figcaption>
    </figure>
  )
}
