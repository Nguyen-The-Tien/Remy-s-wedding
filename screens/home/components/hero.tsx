"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel"

export type HeroData = { video: string } | { images: string[] }

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function Hero({ heroData }: { heroData: HeroData }) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    if (!carouselApi) return
    const onSelect = () => setActiveSlide(carouselApi.selectedScrollSnap())
    carouselApi.on("select", onSelect)
    return () => {
      carouselApi.off("select", onSelect)
    }
  }, [carouselApi])

  return (
    <section className="p-3 sm:p-5 md:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-900 sm:aspect-[16/9] md:aspect-[21/9]"
      >
        {"video" in heroData ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover [filter:grayscale(0.08)_contrast(1.04)]"
          >
            <source src={heroData.video} type="video/mp4" />
          </video>
        ) : (
          <Carousel
            opts={{ loop: true }}
            setApi={setCarouselApi}
            className="absolute inset-0 [&>[data-slot=carousel-content]]:h-full"
          >
            <CarouselContent className="ml-0 h-full">
              {heroData.images.map((src, i) => (
                <CarouselItem key={src} className="relative h-full pl-0">
                  <Image
                    src={src}
                    alt={`Hero slide ${i + 1}`}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className="object-cover [filter:grayscale(0.08)_contrast(1.04)]"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 border-white/30 bg-black/30 text-white hover:bg-black/50 hover:text-white" />
            <CarouselNext className="right-4 border-white/30 bg-black/30 text-white hover:bg-black/50 hover:text-white" />

            <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2 sm:bottom-6">
              {heroData.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`Xem ảnh ${i + 1}`}
                  aria-current={i === activeSlide}
                  onClick={() => carouselApi?.scrollTo(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === activeSlide
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/40 hover:bg-white/70"
                  )}
                />
              ))}
            </div>
          </Carousel>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="absolute inset-x-6 bottom-6 flex flex-col items-end text-right sm:inset-x-10 sm:bottom-10 md:inset-x-14 md:bottom-14"
        >
          <motion.p
            variants={item}
            className="hidden font-serif text-[clamp(1.8rem,4.6vw,3.4rem)] leading-[1.15] text-[var(--on-image)] italic sm:block"
          >
            Kể chuyện tình
            <br />
            bằng điện ảnh.
          </motion.p>
          <motion.p
            variants={item}
            className="hidden mt-3 text-[0.8rem] font-medium tracking-[0.15em] text-[var(--on-image)]/75 uppercase sm:block"
          >
            Pre-wedding · Wedding · Video cưới — Việt Nam
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  )
}
