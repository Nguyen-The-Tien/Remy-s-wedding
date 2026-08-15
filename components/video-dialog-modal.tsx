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
import type { MockAlbum } from "@/lib/mock-albums"

export function VideoDialogModal({
  album,
  onClose,
}: {
  album: MockAlbum | null
  onClose: () => void
}) {
  const isOpen = album !== null && !!album.highlightVideoUrl

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
          {album ? `${album.title} — ${album.location}` : "Video"}
        </DialogTitle>

        {album?.highlightVideoUrl && (
          <>
            <div className="relative aspect-video w-full bg-neutral-900">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${getYouTubeId(album.highlightVideoUrl)}?autoplay=1`}
                title={`Video — ${album.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
            <p className="mt-4 text-center text-sm tracking-wide text-white/60">
              {album.title} · {album.location}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
