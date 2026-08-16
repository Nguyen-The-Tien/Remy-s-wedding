import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { AlbumLink } from "@/components/album-link"
import { AlbumThumb } from "@/components/album-thumb"
import type { MockAlbum } from "@/lib/mock-albums"

export function AlbumFilmRow({ albums }: { albums: MockAlbum[] }) {
  return (
    <>
      <Carousel opts={{ align: "start" }} className="w-full lg:hidden">
        <CarouselContent>
          {albums.map((album) => (
            <CarouselItem key={album.id} className="basis-[80%] sm:basis-[42%]">
              <AlbumLink album={album} className="group block">
                <AlbumThumb
                  album={album}
                  imageClassName="h-[320px] sm:h-[380px]"
                />
              </AlbumLink>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6">
        {albums.slice(0, 8).map((album) => (
          <AlbumLink key={album.id} album={album} className="group block">
            <AlbumThumb album={album} imageClassName="h-[480px]" />
          </AlbumLink>
        ))}
      </div>
    </>
  )
}
