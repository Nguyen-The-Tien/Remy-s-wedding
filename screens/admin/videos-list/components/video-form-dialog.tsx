"use client"

import { useState, type FormEvent, type ReactElement } from "react"
import { CalendarIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fieldErrors, videoSchema, type VideoFormErrors } from "@/lib/admin/schemas"
import { useAdminData } from "@/lib/admin/mock-store"
import type { AdminVideo, VideoFormValues } from "@/lib/admin/types"
import { parseIsoDate, toIsoDate } from "@/lib/utils"

const EMPTY_FORM: VideoFormValues = {
  title: "",
  location: "",
  eventDate: "",
  youtubeUrl: "",
}

function formFromVideo(video: AdminVideo): VideoFormValues {
  return {
    title: video.title,
    location: video.location,
    eventDate: video.eventDate,
    youtubeUrl: video.youtubeUrl,
  }
}

export function VideoFormDialog({
  video,
  trigger,
}: {
  video?: AdminVideo
  trigger: ReactElement
}) {
  const { createVideo, updateVideo } = useAdminData()
  const isEdit = !!video

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<VideoFormValues>(
    video ? formFromVideo(video) : EMPTY_FORM
  )
  const [errors, setErrors] = useState<VideoFormErrors>({})

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setForm(video ? formFromVideo(video) : EMPTY_FORM)
      setErrors({})
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const result = videoSchema.safeParse(form)
    if (!result.success) {
      setErrors(fieldErrors(result.error.issues))
      return
    }

    if (video) {
      updateVideo(video.id, result.data)
      toast.success("Đã lưu video")
    } else {
      createVideo(result.data)
      toast.success("Đã thêm video")
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Sửa video" : "Thêm video"}</DialogTitle>
            <DialogDescription>
              Chỉ cần tên cặp cưới, địa điểm, ngày quay và link YouTube.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video-title">Tên cặp cưới</Label>
              <Input
                id="video-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Linh & Minh"
                autoFocus
              />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video-location">Địa điểm</Label>
              <Input
                id="video-location"
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                placeholder="Phú Quốc"
              />
              {errors.location && (
                <p className="text-xs text-destructive">{errors.location}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video-date">Ngày quay</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      id="video-date"
                      type="button"
                      variant="outline"
                      className="w-full justify-start font-normal"
                    />
                  }
                >
                  <CalendarIcon className="size-4" />
                  {form.eventDate
                    ? parseIsoDate(form.eventDate)?.toLocaleDateString("vi-VN")
                    : "Chọn ngày"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={parseIsoDate(form.eventDate)}
                    onSelect={(date) =>
                      date && setForm({ ...form, eventDate: toIsoDate(date) })
                    }
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.eventDate && (
                <p className="text-xs text-destructive">{errors.eventDate}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video-url">Link YouTube</Label>
              <Input
                id="video-url"
                value={form.youtubeUrl}
                onChange={(e) =>
                  setForm({ ...form, youtubeUrl: e.target.value })
                }
                placeholder="https://youtube.com/watch?v=..."
              />
              {errors.youtubeUrl && (
                <p className="text-xs text-destructive">{errors.youtubeUrl}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">
              {isEdit ? "Lưu thay đổi" : "Thêm video"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
