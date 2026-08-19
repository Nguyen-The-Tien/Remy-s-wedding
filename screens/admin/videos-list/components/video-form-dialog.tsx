"use client"

import { useState, type FormEvent, type ReactElement } from "react"
import { CalendarIcon } from "lucide-react"
import { toast } from "sonner"

import { LoadingOverlay } from "@/components/admin/loading-overlay"
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
import { useCreateVideo, useUpdateVideo } from "@/lib/queries/videos"
import type { VideoRow } from "@/lib/supabase/types"
import { parseIsoDate, toIsoDate } from "@/lib/utils"

type VideoFormValues = {
  title: string
  location: string
  eventDate: string
  youtubeUrl: string
}

const EMPTY_FORM: VideoFormValues = {
  title: "",
  location: "",
  eventDate: "",
  youtubeUrl: "",
}

function formFromVideo(video: VideoRow): VideoFormValues {
  return {
    title: video.title,
    location: video.location,
    eventDate: video.event_date,
    youtubeUrl: video.youtube_url,
  }
}

export function VideoFormDialog({
  video,
  trigger,
}: {
  video?: VideoRow
  trigger: ReactElement
}) {
  const createVideo = useCreateVideo()
  const updateVideo = useUpdateVideo()
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
    if (createVideo.isPending || updateVideo.isPending) return
    const result = videoSchema.safeParse(form)
    if (!result.success) {
      setErrors(fieldErrors(result.error.issues))
      return
    }

    if (video) {
      updateVideo.mutate(
        {
          id: video.id,
          patch: {
            title: result.data.title,
            location: result.data.location,
            event_date: result.data.eventDate,
            youtube_url: result.data.youtubeUrl,
          },
        },
        {
          onSuccess: () => {
            toast.success("Đã lưu video")
            setOpen(false)
          },
          onError: () => toast.error("Không thể lưu video"),
        }
      )
    } else {
      createVideo.mutate(
        {
          title: result.data.title,
          location: result.data.location,
          eventDate: result.data.eventDate,
          youtubeUrl: result.data.youtubeUrl,
        },
        {
          onSuccess: () => {
            toast.success("Đã thêm video")
            setOpen(false)
          },
          onError: () => toast.error("Không thể thêm video"),
        }
      )
    }
  }

  const isPending = createVideo.isPending || updateVideo.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <LoadingOverlay active={isPending} />
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
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video-location">Địa điểm</Label>
              <Input
                id="video-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
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
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
              {errors.youtubeUrl && (
                <p className="text-xs text-destructive">{errors.youtubeUrl}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isEdit ? "Lưu thay đổi" : "Thêm video"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
