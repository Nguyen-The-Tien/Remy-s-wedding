"use client"

import { useRef } from "react"
import { ImageUp, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function MediaUploadField({
  id,
  label,
  value,
  onFileSelected,
  onClear,
  uploading,
  kind,
}: {
  id: string
  label: string
  value: string
  onFileSelected: (file: File) => void
  onClear: () => void
  uploading?: boolean
  kind: "image" | "video"
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onFileSelected(file)
    e.target.value = ""
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>

      <div className="flex items-center gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {value ? (
            kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="size-full object-cover" />
            ) : (
              <video src={value} className="size-full object-cover" muted />
            )
          ) : (
            <ImageUp className="size-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Đang tải..." : value ? "Đổi file" : "Tải lên"}
          </Button>
          {value && !uploading && (
            <Button type="button" variant="ghost" size="icon-sm" onClick={onClear}>
              <X />
              <span className="sr-only">Xoá</span>
            </Button>
          )}
        </div>

        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={kind === "image" ? "image/*" : "video/*"}
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  )
}
