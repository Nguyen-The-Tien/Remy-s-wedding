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
import { useAdminData } from "@/lib/admin/mock-store"
import type { AdminVideo } from "@/lib/admin/types"
import { videoThumbnail } from "@/lib/mock-videos"
import { formatDdMmYyyy } from "@/lib/utils"
import { VideoFormDialog } from "@/screens/admin/videos-list/components/video-form-dialog"

export function VideoTable({ videos }: { videos: AdminVideo[] }) {
  const { toggleVideoPublished, deleteVideo } = useAdminData()

  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        Chưa có video nào.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
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
                    src={videoThumbnail(video.youtubeUrl)}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium text-foreground">
                  {video.title || "(Chưa đặt tên)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {video.location || "—"}
                </p>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {video.eventDate ? formatDdMmYyyy(video.eventDate) : "—"}
              </TableCell>
              <TableCell>
                <Switch
                  checked={video.isPublished}
                  onCheckedChange={() => {
                    toggleVideoPublished(video.id)
                    toast.success(
                      video.isPublished ? "Đã ẩn video" : "Đã đăng video"
                    )
                  }}
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
                      deleteVideo(video.id)
                      toast.success("Đã xoá video")
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
