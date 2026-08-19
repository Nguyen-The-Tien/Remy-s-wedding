"use client"

import { motion } from "framer-motion"
import Link from "next/link"

import { ContactSection } from "@/components/contact-section"
import { SitePagination } from "@/components/site-pagination"
import { VideoListGrid } from "@/screens/video-list/components/video-list-grid"
import { VIDEO_CATEGORY_LABEL, VIDEO_CATEGORY_TITLE } from "@/lib/videos"
import type { ContactInfo } from "@/lib/contact"
import type { VideoRow } from "@/lib/supabase/types"

export function VideoListScreen({
  videos,
  page,
  totalPages,
  contact,
}: {
  videos: VideoRow[]
  page: number
  totalPages: number
  contact: ContactInfo
}) {
  return (
    <main>
      <section className="pt-10 pb-10 md:pt-12 md:pb-14">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Link
              href="/"
              className="text-[0.72rem] font-medium tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-clay"
            >
              ← Trang chủ
            </Link>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
              <p className="text-sm font-medium tracking-[0.2em] text-clay uppercase">
                {VIDEO_CATEGORY_LABEL}
              </p>
            </div>
            <h1 className="mt-2 font-serif text-[clamp(2.4rem,6vw,4rem)] text-foreground">
              {VIDEO_CATEGORY_TITLE}
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <VideoListGrid videos={videos} />
          <SitePagination basePath="/videos" page={page} totalPages={totalPages} />
        </div>
      </section>

      <ContactSection contact={contact} />
    </main>
  )
}
