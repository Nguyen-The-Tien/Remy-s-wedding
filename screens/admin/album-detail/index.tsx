"use client"

import { useState } from "react"
import {
  ArrowLeft,
  CalendarIcon,
  GalleryHorizontal,
  Info,
  SlidersHorizontal,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { MediaUploadField } from "@/components/admin/media-upload-field"
import { PhotoManager } from "@/components/admin/photo-manager"
import { SectionCard } from "@/components/admin/section-card"
import { CATEGORY_LABEL, type AlbumCategory } from "@/lib/mock-albums"
import { useAdminData } from "@/lib/admin/mock-store"
import { albumSchema, fieldErrors, type AlbumFormErrors } from "@/lib/admin/schemas"
import type { AdminAlbum, AlbumFormValues } from "@/lib/admin/types"
import { composeSlug, parseIsoDate, toIsoDate } from "@/lib/utils"

function toFormValues(album: AdminAlbum): AlbumFormValues {
  return {
    title: album.title,
    slug: composeSlug(album.title, album.eventDate),
    category: album.category,
    location: album.location,
    eventDate: album.eventDate,
    highlightVideoUrl: album.highlightVideoUrl,
    coverImage: album.coverImage,
    isFeatured: album.isFeatured,
    isPublished: album.isPublished,
    photos: album.photos,
  }
}

export function AlbumDetailScreen({ albumId }: { albumId: string }) {
  const router = useRouter()
  const { getAlbum, updateAlbum, deleteAlbum } = useAdminData()

  const album = getAlbum(albumId)

  const [form, setForm] = useState<AlbumFormValues | null>(
    album ? toFormValues(album) : null
  )
  // Snapshot taken at load/last-save time — the dirty check compares against
  // this, not the raw store record, so the auto-composed slug on first load
  // doesn't itself count as an unsaved change.
  const [savedForm, setSavedForm] = useState<AlbumFormValues | null>(
    album ? toFormValues(album) : null
  )
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState<AlbumFormErrors>({})

  if (!album || !form) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">
          Không tìm thấy album này.
        </p>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/admin/albums" />}
        >
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm)

  function handleSave() {
    if (!form) return

    const result = albumSchema.safeParse(form)
    if (!result.success) {
      setErrors(fieldErrors(result.error.issues))
      toast.error("Vui lòng kiểm tra lại thông tin trước khi lưu")
      return
    }

    setErrors({})
    updateAlbum(albumId, form)
    setSavedForm(form)
    toast.success("Đã lưu thay đổi")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/albums"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Albums
          </Link>
          <span className="text-border">/</span>
          <span className="text-sm font-medium text-foreground">
            {album.title || "(Chưa đặt tên)"}
          </span>
          <Badge variant={album.isPublished ? "default" : "outline"}>
            {album.isPublished ? "Đã đăng" : "Bản nháp"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && <Button onClick={handleSave}>Lưu thay đổi</Button>}
          <ConfirmDialog
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 className="size-4" />
                Xoá album
              </Button>
            }
            title={`Xoá "${album.title}"?`}
            description="Album và toàn bộ ảnh sẽ bị xoá vĩnh viễn. Không thể hoàn tác."
            onConfirm={() => {
              deleteAlbum(albumId)
              toast.success("Đã xoá album")
              router.push("/admin/albums")
            }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <SectionCard
          icon={Info}
          title="Thông tin album"
          description="Tên, danh mục và ảnh bìa"
          className="flex flex-col"
        >
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Tên album</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value
                    setForm({
                      ...form,
                      title,
                      slug: slugTouched
                        ? form.slug
                        : composeSlug(title, form.eventDate),
                    })
                  }}
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setForm({ ...form, slug: e.target.value })
                  }}
                  aria-invalid={Boolean(errors.slug)}
                />
                {errors.slug && (
                  <p className="text-xs text-destructive">{errors.slug}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category">Danh mục</Label>
                <Select
                  items={CATEGORY_LABEL}
                  value={form.category}
                  onValueChange={(value) =>
                    setForm({ ...form, category: value as AlbumCategory })
                  }
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABEL) as AlbumCategory[]).map(
                      (key) => (
                        <SelectItem key={key} value={key}>
                          {CATEGORY_LABEL[key]}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="location">Địa điểm</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  aria-invalid={Boolean(errors.location)}
                />
                {errors.location && (
                  <p className="text-xs text-destructive">
                    {errors.location}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="eventDate">Ngày cưới</Label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        id="eventDate"
                        type="button"
                        variant="outline"
                        className="w-full justify-start font-normal"
                        aria-invalid={Boolean(errors.eventDate)}
                      />
                    }
                  >
                    <CalendarIcon className="size-4" />
                    {form.eventDate
                      ? parseIsoDate(form.eventDate)?.toLocaleDateString(
                          "vi-VN"
                        )
                      : "Chọn ngày"}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={parseIsoDate(form.eventDate)}
                      onSelect={(date) => {
                        if (!date) return
                        const eventDate = toIsoDate(date)
                        setForm({
                          ...form,
                          eventDate,
                          slug: slugTouched
                            ? form.slug
                            : composeSlug(form.title, eventDate),
                        })
                      }}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.eventDate && (
                  <p className="text-xs text-destructive">
                    {errors.eventDate}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="highlightVideoUrl">
                  Video highlight (YouTube/Vimeo, không bắt buộc)
                </Label>
                <Input
                  id="highlightVideoUrl"
                  value={form.highlightVideoUrl}
                  onChange={(e) =>
                    setForm({ ...form, highlightVideoUrl: e.target.value })
                  }
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <MediaUploadField
                id="coverImage"
                label="Ảnh bìa"
                kind="image"
                value={form.coverImage}
                onChange={(url) => setForm({ ...form, coverImage: url })}
              />
              {errors.coverImage && (
                <p className="text-xs text-destructive">
                  {errors.coverImage}
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={SlidersHorizontal}
          title="Trạng thái"
          description="Lưu cùng với thông tin album"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Đã đăng</p>
                <p className="text-xs text-muted-foreground">
                  Hiển thị công khai trên trang chủ
                </p>
              </div>
              <Switch
                checked={form.isPublished}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isPublished: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Nổi bật</p>
                <p className="text-xs text-muted-foreground">
                  Xuất hiện ở mục album nổi bật
                </p>
              </div>
              <Switch
                checked={form.isFeatured}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isFeatured: checked })
                }
              />
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        icon={GalleryHorizontal}
        title="Ảnh"
        description="Kéo thứ tự bằng mũi tên, ảnh đầu tiên là ảnh đại diện trong lưới"
      >
        <div className="flex flex-col gap-2">
          <PhotoManager
            photos={form.photos}
            onAdd={(files) =>
              setForm({
                ...form,
                photos: [
                  ...form.photos,
                  ...files.map((file) => ({
                    id: crypto.randomUUID(),
                    url: URL.createObjectURL(file),
                  })),
                ],
              })
            }
            onRemove={(photoId) =>
              setForm({
                ...form,
                photos: form.photos.filter((p) => p.id !== photoId),
              })
            }
            onMove={(photoId, direction) => {
              const index = form.photos.findIndex((p) => p.id === photoId)
              if (index === -1) return
              const swapWith = direction === "up" ? index - 1 : index + 1
              if (swapWith < 0 || swapWith >= form.photos.length) return
              const photos = [...form.photos]
              ;[photos[index], photos[swapWith]] = [
                photos[swapWith],
                photos[index],
              ]
              setForm({ ...form, photos })
            }}
          />
          {errors.photos && (
            <p className="text-xs text-destructive">{errors.photos}</p>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
