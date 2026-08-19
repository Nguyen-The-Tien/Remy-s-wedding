"use client"

import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { LoadingOverlay } from "@/components/admin/loading-overlay"
import { useDeleteVideo, useUpdateVideo } from "@/lib/queries/videos"
import type { VideoRow } from "@/lib/supabase/types"
import { videoThumbnail } from "@/lib/videos"
import { formatDdMmYyyy } from "@/lib/utils"
import { VideoFormDialog } from "@/screens/admin/videos-list/components/video-form-dialog"

export function VideoTable({ videos }: { videos: VideoRow[] }) {
  const updateVideo = useUpdateVideo()
  const deleteVideo = useDeleteVideo()

  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        Chưa có video nào.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <LoadingOverlay active={updateVideo.isPending || deleteVideo.isPending} />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16"></TableHead>
            <TableHead>Video</TableHead>
            <TableHead>Ngày quay</TableHead>
            <TableHead>Đã đăng</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => (
            <TableRow key={video.id}>
              <TableCell>
                <div className="relative size-11 overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={videoThumbnail(video.youtube_url)}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium text-foreground">
                  {video.title || "(Chưa đặt tên)"}
                </p>
                <p className="text-xs text-muted-foreground">{video.location || "—"}</p>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {video.event_date ? formatDdMmYyyy(video.event_date) : "—"}
              </TableCell>
              <TableCell>
                <Switch
                  checked={video.is_published}
                  disabled={updateVideo.isPending}
                  onCheckedChange={(checked) =>
                    updateVideo.mutate(
                      { id: video.id, patch: { is_published: checked } },
                      {
                        onSuccess: () =>
                          toast.success(checked ? "Đã đăng video" : "Đã ẩn video"),
                        onError: () => toast.error("Không thể cập nhật video"),
                      }
                    )
                  }
                />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <VideoFormDialog
                    video={video}
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Pencil />
                        <span className="sr-only">Sửa</span>
                      </Button>
                    }
                  />
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Trash2 />
                        <span className="sr-only">Xoá</span>
                      </Button>
                    }
                    title={`Xoá video "${video.title}"?`}
                    description="Video sẽ bị xoá khỏi trang. Không thể hoàn tác."
                    onConfirm={() => {
                      deleteVideo.mutate(video.id, {
                        onSuccess: () => toast.success("Đã xoá video"),
                        onError: () => toast.error("Không thể xoá video"),
                      })
                    }}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
