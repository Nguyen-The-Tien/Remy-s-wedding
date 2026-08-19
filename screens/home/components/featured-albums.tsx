"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import type { ReactNode } from "react"

import { AlbumFilmRow } from "@/screens/home/components/album-film-row"
import { VideoGrid } from "@/screens/home/components/video-grid"
import { CATEGORY_LABEL, CATEGORY_TITLE, type AlbumCardData } from "@/lib/albums"
import { VIDEO_CATEGORY_LABEL, VIDEO_CATEGORY_TITLE } from "@/lib/videos"
import type { VideoRow } from "@/lib/supabase/types"

export function FeaturedAlbums({
  preWeddingAlbums,
  weddingAlbums,
  videos,
}: {
  preWeddingAlbums: AlbumCardData[]
  weddingAlbums: AlbumCardData[]
  videos: VideoRow[]
}) {
  return (
    <>
      <Section
        id="pre-wedding"
        label={CATEGORY_LABEL.pre_wedding}
        title={CATEGORY_TITLE.pre_wedding}
        href="/pre-wedding"
      >
        <AlbumFilmRow albums={preWeddingAlbums} />
      </Section>

      <Section
        id="wedding"
        label={CATEGORY_LABEL.wedding}
        title={CATEGORY_TITLE.wedding}
        href="/wedding"
      >
        <AlbumFilmRow albums={weddingAlbums} />
      </Section>

      <Section
        id="video"
        label={VIDEO_CATEGORY_LABEL}
        title={VIDEO_CATEGORY_TITLE}
        href="/videos"
      >
        <VideoGrid videos={videos} />
      </Section>
    </>
  )
}

function Section({
  id,
  label,
  title,
  href,
  children,
}: {
  id: string
  label: string
  title: string
  href: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:pt-20 md:pb-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 border-b border-border pb-6 md:mb-10"
        >
          <p className="text-sm font-medium tracking-[0.2em] text-clay uppercase">
            {label}
          </p>
          <h2 className="mt-2 font-serif text-[clamp(2.1rem,4.4vw,3.1rem)] text-foreground">
            {title}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >
          {children}
        </motion.div>

        <div className="mt-9 flex justify-center md:mt-11">
          <Link
            href={href}
            className="group flex flex-col items-center gap-1.5 text-[0.72rem] font-medium tracking-[0.18em] text-foreground uppercase transition-colors hover:text-clay"
          >
            Xem tất cả
            <span className="h-px w-6 bg-current transition-all group-hover:w-9" />
          </Link>
        </div>
      </div>
    </section>
  )
}
