import { AlbumLink } from "@/components/album-link"
import { AlbumThumb } from "@/components/album-thumb"
import type { AlbumCardData } from "@/lib/albums"

export function WeddingGrid({ albums }: { albums: AlbumCardData[] }) {
  const [featured, ...rest] = albums

  if (!featured) return null

  return (
    <div className="space-y-12 md:space-y-16">
      <div>
        <p className="mb-4 text-[0.7rem] font-medium tracking-[0.16em] text-clay uppercase">
          Album mới nhất
        </p>
        <AlbumLink album={featured} className="group block">
          <AlbumThumb
            album={featured}
            imageClassName="aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9]"
          />
        </AlbumLink>
      </div>

      {rest.length > 0 && (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8">
          {rest.map((album) => (
            <AlbumLink key={album.id} album={album} className="group block">
              <AlbumThumb album={album} imageClassName="aspect-[3/4]" />
            </AlbumLink>
          ))}
        </div>
      )}
    </div>
  )
}
