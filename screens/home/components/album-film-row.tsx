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
    <Carousel opts={{ align: "start" }} className="w-full">
      <CarouselContent className="lg:-ml-6">
        {albums.map((album) => (
          <CarouselItem
            key={album.id}
            className="basis-[80%] sm:basis-[42%] lg:basis-1/4 lg:pl-6"
          >
            <AlbumLink album={album} className="group block">
              <AlbumThumb
                album={album}
                imageClassName="h-[320px] sm:h-[380px] lg:h-[480px]"
              />
            </AlbumLink>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
