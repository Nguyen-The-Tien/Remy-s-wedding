import { AlbumLink } from "@/components/album-link"
import { AlbumThumb } from "@/components/album-thumb"
import type { AlbumCardData } from "@/lib/albums"

export function AlbumGrid({ albums }: { albums: AlbumCardData[] }) {
  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8">
      {albums.map((album) => (
        <AlbumLink key={album.id} album={album} className="group block">
          <AlbumThumb album={album} imageClassName="aspect-[3/4]" />
        </AlbumLink>
      ))}
    </div>
  )
}
