"use client"

import { motion } from "framer-motion"
import Link from "next/link"

import { AlbumFilmRow } from "@/screens/home/components/album-film-row"
import { VideoGrid } from "@/screens/home/components/video-grid"
import {
  albumsByCategory,
  CATEGORY_LABEL,
  CATEGORY_TITLE,
  type AlbumCategory,
} from "@/lib/mock-albums"

const SECTIONS: { category: AlbumCategory; href: string }[] = [
  { category: "pre_wedding", href: "/pre-wedding" },
  { category: "wedding", href: "/wedding" },
  { category: "video", href: "#" },
]

export function FeaturedAlbums() {
  return (
    <>
      {SECTIONS.map(({ category, href }) => (
        <CategorySection key={category} category={category} href={href} />
      ))}
    </>
  )
}

function CategorySection({
  category,
  href,
}: {
  category: AlbumCategory
  href: string
}) {
  const albums = albumsByCategory(category, 4)

  return (
    <section
      id={
        category === "pre_wedding"
          ? "pre-wedding"
          : category === "video"
            ? "video"
            : "wedding"
      }
      className="scroll-mt-20"
    >
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:pt-20 md:pb-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 border-b border-border pb-6 md:mb-10"
        >
          <p className="text-sm font-medium tracking-[0.2em] text-clay uppercase">
            {CATEGORY_LABEL[category]}
          </p>
          <h2 className="mt-2 font-serif text-[clamp(2.1rem,4.4vw,3.1rem)] text-foreground">
            {CATEGORY_TITLE[category]}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >
          {category === "video" ? (
            <VideoGrid albums={albums} />
          ) : (
            <AlbumFilmRow albums={albums} />
          )}
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
