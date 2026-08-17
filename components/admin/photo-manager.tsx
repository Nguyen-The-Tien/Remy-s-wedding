"use client"

import { useRef } from "react"
import { ArrowLeft, ArrowRight, ImagePlus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { AdminPhoto } from "@/lib/admin/types"

export function PhotoManager({
  photos,
  onAdd,
  onRemove,
  onMove,
}: {
  photos: AdminPhoto[]
  onAdd: (files: File[]) => void
  onRemove: (photoId: string) => void
  onMove: (photoId: string, direction: "up" | "down") => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) onAdd(files)
    e.target.value = ""
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          Ảnh ({photos.length})
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          Thêm ảnh
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />
      </div>

      {photos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Chưa có ảnh nào. Bấm &ldquo;Thêm ảnh&rdquo; để tải lên.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" className="size-full object-cover" />

              <div className="absolute inset-0 flex flex-col justify-between bg-black/0 p-1.5 opacity-0 transition-opacity group-hover:bg-black/30 group-hover:opacity-100">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-xs"
                    onClick={() => onRemove(photo.id)}
                  >
                    <X />
                    <span className="sr-only">Xoá ảnh</span>
                  </Button>
                </div>
                <div className="flex justify-center gap-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-xs"
                    disabled={index === 0}
                    onClick={() => onMove(photo.id, "up")}
                  >
                    <ArrowLeft />
                    <span className="sr-only">Lên trước</span>
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-xs"
                    disabled={index === photos.length - 1}
                    onClick={() => onMove(photo.id, "down")}
                  >
                    <ArrowRight />
                    <span className="sr-only">Ra sau</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
