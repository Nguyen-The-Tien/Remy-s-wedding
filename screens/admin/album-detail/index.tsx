"use client"

import { useEffect, useState } from "react"
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
import { FullPageLoading } from "@/components/admin/full-page-loading"
import { LoadingOverlay } from "@/components/admin/loading-overlay"
import { MediaUploadField } from "@/components/admin/media-upload-field"
import { PhotoManager } from "@/components/admin/photo-manager"
import { SectionCard } from "@/components/admin/section-card"
import { CATEGORY_LABEL, type AlbumCategory } from "@/lib/mock-albums"
import {
  useAddPhoto,
  useAlbum,
  useDeleteAlbum,
  useDeletePhoto,
  useUpdateAlbum,
  useUpdatePhotoSortOrder,
} from "@/lib/queries/albums"
import { useUploadFile } from "@/lib/queries/uploads"
import { albumSchema, fieldErrors, type AlbumFormErrors } from "@/lib/admin/schemas"
import { publicImageUrl } from "@/lib/r2-url"
import { composeSlug, parseIsoDate, toIsoDate } from "@/lib/utils"

type ScalarForm = {
  title: string
  slug: string
  category: AlbumCategory
  location: string
  eventDate: string
  highlightVideoUrl: string
  coverImageKey: string
}

export function AlbumDetailScreen({ albumId }: { albumId: string }) {
  const router = useRouter()
  const [isDeleted, setIsDeleted] = useState(false)
  const { data: album, isLoading } = useAlbum(albumId, { enabled: !isDeleted })
  const updateAlbum = useUpdateAlbum(albumId)
  const deleteAlbum = useDeleteAlbum()
  const addPhoto = useAddPhoto(albumId)
  const deletePhoto = useDeletePhoto(albumId)
  const updatePhotoSortOrder = useUpdatePhotoSortOrder(albumId)
  const uploadFile = useUploadFile()
  const uploadCoverImage = useUploadFile()

  const [form, setForm] = useState<ScalarForm | null>(null)
  const [savedForm, setSavedForm] = useState<ScalarForm | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState<AlbumFormErrors>({})
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState("")
  const [isReordering, setIsReordering] = useState(false)

  useEffect(() => {
    if (!album) return
    const values: ScalarForm = {
      title: album.title,
      slug: album.slug,
      category: album.category,
      location: album.location ?? "",
      eventDate: album.event_date ?? "",
      highlightVideoUrl: album.highlight_video_url ?? "",
      coverImageKey: album.cover_image_key ?? "",
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(values)
    setSavedForm(values)
  }, [album])

  if (isLoading) {
    return <FullPageLoading />
  }

  if (!album || !form) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">Không tìm thấy album này.</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/albums" />}>
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  const isDirty =
    JSON.stringify(form) !== JSON.stringify(savedForm) || coverImageFile !== null

  async function handleSave() {
    if (!form || !album) return
    if (updateAlbum.isPending || uploadCoverImage.isPending) return

    const result = albumSchema.safeParse({
      title: form.title,
      slug: form.slug,
      category: form.category,
      location: form.location,
      eventDate: form.eventDate,
      highlightVideoUrl: form.highlightVideoUrl,
      coverImage: coverImageFile ? "pending" : form.coverImageKey,
      isFeatured: album.is_featured,
      isPublished: album.is_published,
    })
    if (!result.success) {
      setErrors(fieldErrors(result.error.issues))
      toast.error("Vui lòng kiểm tra lại thông tin trước khi lưu")
      return
    }
    setErrors({})

    let coverImageKey = form.coverImageKey
    if (coverImageFile) {
      try {
        const uploaded = await uploadCoverImage.mutateAsync({
          file: coverImageFile,
          kind: "album-photo",
          albumSlug: album.slug,
        })
        coverImageKey = uploaded.key
      } catch {
        toast.error("Không thể tải ảnh bìa lên")
        return
      }
    }

    updateAlbum.mutate(
      {
        title: form.title,
        slug: form.slug,
        location: form.location,
        event_date: form.eventDate || null,
        highlight_video_url: form.highlightVideoUrl || null,
        cover_image_key: coverImageKey || null,
      },
      {
        onSuccess: () => {
          const savedValues = { ...form, coverImageKey }
          setForm(savedValues)
          setSavedForm(savedValues)
          if (coverImagePreview) URL.revokeObjectURL(coverImagePreview)
          setCoverImageFile(null)
          setCoverImagePreview("")
          toast.success("Đã lưu thay đổi")
        },
        onError: () => toast.error("Không thể lưu thay đổi"),
      }
    )
  }

  const displayPhotos = album.photos.map((p) => ({
    id: p.id,
    url: publicImageUrl(p.image_key),
  }))

  const isBusy =
    updateAlbum.isPending ||
    deleteAlbum.isPending ||
    uploadFile.isPending ||
    uploadCoverImage.isPending ||
    addPhoto.isPending ||
    deletePhoto.isPending ||
    updatePhotoSortOrder.isPending ||
    isReordering

  return (
    <div className="flex flex-col gap-6">
      <LoadingOverlay active={isBusy} />
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
          <Badge variant={album.is_published ? "default" : "outline"}>
            {album.is_published ? "Đã đăng" : "Bản nháp"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
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
              setIsDeleted(true)
              deleteAlbum.mutate(albumId, {
                onSuccess: () => {
                  toast.success("Đã xoá album")
                  router.push("/admin/albums")
                },
                onError: () => {
                  setIsDeleted(false)
                  toast.error("Không thể xoá album")
                },
              })
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
                      slug: slugTouched ? form.slug : composeSlug(title, form.eventDate),
                    })
                  }}
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
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
                {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
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
                    {(Object.keys(CATEGORY_LABEL) as AlbumCategory[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {CATEGORY_LABEL[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="location">Địa điểm</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  aria-invalid={Boolean(errors.location)}
                />
                {errors.location && (
                  <p className="text-xs text-destructive">{errors.location}</p>
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
                      ? parseIsoDate(form.eventDate)?.toLocaleDateString("vi-VN")
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
                          slug: slugTouched ? form.slug : composeSlug(form.title, eventDate),
                        })
                      }}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.eventDate && (
                  <p className="text-xs text-destructive">{errors.eventDate}</p>
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
                value={
                  coverImagePreview ||
                  (form.coverImageKey ? publicImageUrl(form.coverImageKey) : "")
                }
                uploading={uploadCoverImage.isPending}
                onFileSelected={(file) => {
                  if (coverImagePreview) URL.revokeObjectURL(coverImagePreview)
                  setCoverImageFile(file)
                  setCoverImagePreview(URL.createObjectURL(file))
                }}
                onClear={() => {
                  if (coverImagePreview) URL.revokeObjectURL(coverImagePreview)
                  setCoverImageFile(null)
                  setCoverImagePreview("")
                  setForm({ ...form, coverImageKey: "" })
                }}
              />
              {errors.coverImage && (
                <p className="text-xs text-destructive">{errors.coverImage}</p>
              )}
            </div>

            {isDirty && (
              <div className="flex justify-end border-t border-border pt-4">
                <Button onClick={handleSave} disabled={updateAlbum.isPending}>
                  Lưu thay đổi
                </Button>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          icon={SlidersHorizontal}
          title="Trạng thái"
          description="Cập nhật ngay khi bật/tắt"
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
                checked={album.is_published}
                disabled={updateAlbum.isPending}
                onCheckedChange={(checked) =>
                  updateAlbum.mutate(
                    { is_published: checked },
                    {
                      onSuccess: () =>
                        toast.success(checked ? "Đã đăng album" : "Đã ẩn album"),
                      onError: () => toast.error("Không thể cập nhật"),
                    }
                  )
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
                checked={album.is_featured}
                disabled={updateAlbum.isPending}
                onCheckedChange={(checked) =>
                  updateAlbum.mutate(
                    { is_featured: checked },
                    {
                      onSuccess: () =>
                        toast.success(
                          checked ? "Đã đánh dấu nổi bật" : "Đã bỏ nổi bật"
                        ),
                      onError: () => toast.error("Không thể cập nhật"),
                    }
                  )
                }
              />
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        icon={GalleryHorizontal}
        title="Ảnh"
        description="Mỗi thay đổi ở đây lưu ngay, không cần bấm Lưu thay đổi"
      >
        <div className="flex flex-col gap-2">
          <PhotoManager
            photos={displayPhotos}
            onAdd={(files) => {
              const baseSortOrder = album.photos.length
              files.forEach(async (file, index) => {
                try {
                  const { key } = await uploadFile.mutateAsync({
                    file,
                    kind: "album-photo",
                    albumSlug: album.slug,
                  })
                  await addPhoto.mutateAsync({
                    imageKey: key,
                    sortOrder: baseSortOrder + index,
                  })
                } catch {
                  toast.error("Không thể tải ảnh lên")
                }
              })
            }}
            onRemove={(photoId) => {
              deletePhoto.mutate(photoId, {
                onError: () => toast.error("Không thể xoá ảnh"),
              })
            }}
            onMove={async (photoId, direction) => {
              const index = album.photos.findIndex((p) => p.id === photoId)
              if (index === -1) return
              const swapWith = direction === "up" ? index - 1 : index + 1
              if (swapWith < 0 || swapWith >= album.photos.length) return

              setIsReordering(true)
              try {
                await updatePhotoSortOrder.mutateAsync({
                  photoId: album.photos[index].id,
                  sortOrder: album.photos[swapWith].sort_order,
                })
                await updatePhotoSortOrder.mutateAsync({
                  photoId: album.photos[swapWith].id,
                  sortOrder: album.photos[index].sort_order,
                })
              } catch {
                toast.error("Không thể sắp xếp ảnh")
              } finally {
                setIsReordering(false)
              }
            }}
          />
        </div>
      </SectionCard>
    </div>
  )
}
