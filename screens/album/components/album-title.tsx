"use client"

import { motion } from "framer-motion"
import Link from "next/link"

import type { MockAlbum } from "@/lib/mock-albums"
import { CATEGORY_LABEL } from "@/lib/mock-albums"

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
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

export function AlbumTitle({
  album,
  listHref,
}: {
  album: MockAlbum
  listHref: string
}) {
  return (
    <section className="pt-8 pb-14 md:pt-12 md:pb-16">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item}>
            <Link
              href={listHref}
              className="text-[0.7rem] font-medium tracking-[0.2em] text-muted-foreground uppercase transition-colors hover:text-clay"
            >
              ← {CATEGORY_LABEL[album.category]}
            </Link>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-5 font-serif text-[clamp(2.4rem,5.6vw,4rem)] leading-[1.05] text-foreground"
          >
            {album.title}
          </motion.h1>

          <motion.div
            variants={item}
            className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 md:mt-6"
          >
            <span className="font-serif text-lg text-clay italic md:text-xl">
              {album.location}
            </span>
            <span aria-hidden className="h-3 w-px bg-border" />
            <span className="text-[0.72rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              {album.date} · {album.photos.length} ảnh
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
