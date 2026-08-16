"use client"

import { motion } from "framer-motion"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { AlbumLink } from "@/components/album-link"
import { AlbumThumb } from "@/components/album-thumb"
import { recentAlbums } from "@/lib/mock-albums"

export function RecentStories() {
  const albums = recentAlbums(8)

  return (
    <section>
      <Carousel opts={{ align: "start" }} className="w-full">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8 flex flex-wrap items-baseline justify-between gap-4 py-10 md:mb-10 md:py-10"
          >
            <div>
              <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
                Câu chuyện gần đây
              </p>
              <h2 className="mt-2 font-serif text-[clamp(2rem,4.2vw,2.9rem)] text-foreground">
                Những khoảnh khắc nổi bật nhất nhất
              </h2>
            </div>

            <div className="flex gap-3">
              <CarouselPrevious className="static inset-auto! my-0! size-11 translate-y-0! border-border bg-transparent text-foreground transition-colors hover:border-clay hover:bg-transparent hover:text-clay disabled:opacity-30" />
              <CarouselNext className="static inset-auto! my-0! size-11 translate-y-0! border-border bg-transparent text-foreground transition-colors hover:border-clay hover:bg-transparent hover:text-clay disabled:opacity-30" />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="px-6 pb-16 md:px-10 md:pb-20"
        >
          <CarouselContent>
            {albums.map((album) => (
              <CarouselItem
                key={album.id}
                className="basis-[85%] sm:basis-[34%] lg:basis-[22%]"
              >
                <AlbumLink album={album} className="group block">
                  <AlbumThumb
                    album={album}
                    isVideo={album.category === "video"}
                    imageClassName="aspect-[3/4]"
                  />
                </AlbumLink>
              </CarouselItem>
            ))}
          </CarouselContent>
        </motion.div>
      </Carousel>
    </section>
  )
}
