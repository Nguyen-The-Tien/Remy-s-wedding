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
import { useAdminData } from "@/lib/admin/mock-store"
import type { AdminAlbum } from "@/lib/admin/types"
import { formatDdMmYyyy } from "@/lib/utils"

export function AlbumTable({ albums }: { albums: AdminAlbum[] }) {
  const { togglePublished, toggleFeatured, deleteAlbum } = useAdminData()

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
                  {album.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={album.coverImage}
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
                <Badge variant="outline">
                  {CATEGORY_LABEL[album.category]}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {album.eventDate ? formatDdMmYyyy(album.eventDate) : "—"}
              </TableCell>
              <TableCell>
                <Switch
                  checked={album.isPublished}
                  onCheckedChange={() => {
                    togglePublished(album.id)
                    toast.success(
                      album.isPublished ? "Đã ẩn album" : "Đã đăng album"
                    )
                  }}
                />
              </TableCell>
              <TableCell>
                <Switch
                  checked={album.isFeatured}
                  onCheckedChange={() => toggleFeatured(album.id)}
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
                      deleteAlbum(album.id)
                      toast.success("Đã xoá album")
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
