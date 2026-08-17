"use client"

import { X } from "lucide-react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog"
import { getYouTubeId } from "@/lib/utils"

export type VideoDialogItem = {
  title: string
  location: string
  youtubeUrl: string
}

export function VideoDialogModal({
  video,
  onClose,
}: {
  video: VideoDialogItem | null
  onClose: () => void
}) {
  const isOpen = video !== null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogPortal>
        <DialogClose
          className="fixed top-5 right-5 z-[60] inline-flex border-0 bg-transparent p-0 text-white/70 outline-none transition-colors hover:text-white"
          aria-label="Đóng"
        >
          <X className="size-6" />
        </DialogClose>
      </DialogPortal>

      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] gap-0 border-0 bg-transparent p-0 ring-0 sm:max-w-4xl"
      >
        <DialogTitle className="sr-only">
          {video ? `${video.title} — ${video.location}` : "Video"}
        </DialogTitle>

        {video && (
          <>
            <div className="relative aspect-video w-full bg-neutral-900">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${getYouTubeId(video.youtubeUrl)}?autoplay=1`}
                title={`Video — ${video.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
            <p className="mt-4 text-center text-sm tracking-wide text-white/60">
              {video.title} · {video.location}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
