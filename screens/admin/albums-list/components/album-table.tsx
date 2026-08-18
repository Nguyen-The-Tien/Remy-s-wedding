"use client"

import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import { CATEGORY_LABEL } from "@/lib/mock-albums"
import { useDeleteAlbum, useUpdateAlbum } from "@/lib/queries/albums"
import { publicImageUrl } from "@/lib/r2-url"
import type { AlbumRow } from "@/lib/supabase/types"
import { formatDdMmYyyy } from "@/lib/utils"

function AlbumRowActions({ album }: { album: AlbumRow }) {
  const updateAlbum = useUpdateAlbum(album.id)
  const deleteAlbum = useDeleteAlbum()

  return (
    <>
      <TableCell>
        <Switch
          checked={album.is_published}
          disabled={updateAlbum.isPending}
          onCheckedChange={(checked) => {
            updateAlbum.mutate(
              { is_published: checked },
              {
                onSuccess: () =>
                  toast.success(checked ? "Đã đăng album" : "Đã ẩn album"),
                onError: () => toast.error("Không thể cập nhật album"),
              }
            )
          }}
        />
      </TableCell>
      <TableCell>
        <Switch
          checked={album.is_featured}
          disabled={updateAlbum.isPending}
          onCheckedChange={(checked) =>
            updateAlbum.mutate(
              { is_featured: checked },
              {
                onSuccess: () =>
                  toast.success(checked ? "Đã đánh dấu nổi bật" : "Đã bỏ nổi bật"),
                onError: () => toast.error("Không thể cập nhật album"),
              }
            )
          }
        />
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            nativeButton={false}
            render={<Link href={`/admin/albums/${album.id}`} />}
          >
            <Pencil />
            <span className="sr-only">Sửa</span>
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon-sm">
                <Trash2 />
                <span className="sr-only">Xoá</span>
              </Button>
            }
            title={`Xoá "${album.title}"?`}
            description="Album và toàn bộ ảnh sẽ bị xoá vĩnh viễn. Không thể hoàn tác."
            onConfirm={() => {
              deleteAlbum.mutate(album.id, {
                onSuccess: () => toast.success("Đã xoá album"),
                onError: () => toast.error("Không thể xoá album"),
              })
            }}
          />
        </div>
      </TableCell>
    </>
  )
}

export function AlbumTable({ albums }: { albums: AlbumRow[] }) {
  if (albums.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        Chưa có album nào trong danh mục này.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16"></TableHead>
            <TableHead>Album</TableHead>
            <TableHead>Danh mục</TableHead>
            <TableHead>Ngày</TableHead>
            <TableHead>Đã đăng</TableHead>
            <TableHead>Nổi bật</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {albums.map((album) => (
            <TableRow key={album.id}>
              <TableCell>
                <div className="relative size-11 overflow-hidden rounded-md bg-muted">
                  {album.cover_image_key && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={publicImageUrl(album.cover_image_key)}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/albums/${album.id}`}
                  className="font-medium text-foreground hover:text-clay"
                >
                  {album.title || "(Chưa đặt tên)"}
                </Link>
                <p className="text-xs text-muted-foreground">/{album.slug}</p>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{CATEGORY_LABEL[album.category]}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {album.event_date ? formatDdMmYyyy(album.event_date) : "—"}
              </TableCell>
              <AlbumRowActions album={album} />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
