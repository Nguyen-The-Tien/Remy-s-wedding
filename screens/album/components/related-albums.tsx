import { AlbumLink } from "@/components/album-link"
import { AlbumThumb } from "@/components/album-thumb"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import type { MockAlbum } from "@/lib/mock-albums"

export function RelatedAlbums({ albums }: { albums: MockAlbum[] }) {
  if (albums.length === 0) return null

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:pt-20 md:pb-10">
        <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Có thể bạn cũng thích
        </p>
        <Carousel opts={{ align: "start" }} className="mt-8">
          <CarouselContent className="-ml-4 md:-ml-6">
            {albums.map((album) => (
              <CarouselItem
                key={album.id}
                className="basis-[68%] pl-4 sm:basis-1/2 md:pl-6 lg:basis-1/4"
              >
                <AlbumLink album={album} className="group block">
                  <AlbumThumb album={album} imageClassName="aspect-[3/4]" />
                </AlbumLink>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  )
}
