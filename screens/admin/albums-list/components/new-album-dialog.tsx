"use client"

import { useState, type FormEvent } from "react"
import { CalendarIcon, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CATEGORY_LABEL, type AlbumCategory } from "@/lib/mock-albums"
import { useAdminData } from "@/lib/admin/mock-store"
import { composeSlug, toIsoDate } from "@/lib/utils"

export function NewAlbumDialog() {
  const router = useRouter()
  const { createAlbum } = useAdminData()

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<AlbumCategory>("wedding")
  const [eventDate, setEventDate] = useState<Date | undefined>()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !eventDate) return

    const isoDate = toIsoDate(eventDate)
    const album = createAlbum({
      title: title.trim(),
      category,
      slug: composeSlug(title, isoDate),
      eventDate: isoDate,
    })
    toast.success("Đã tạo album nháp")
    setOpen(false)
    setTitle("")
    setEventDate(undefined)
    router.push(`/admin/albums/${album.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Album mới
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tạo album mới</DialogTitle>
            <DialogDescription>
              Tạo bản nháp, bạn có thể thêm ảnh và chi tiết ở bước tiếp theo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-album-title">Tên album</Label>
              <Input
                id="new-album-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Linh & Minh"
                autoFocus
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-album-category">Danh mục</Label>
              <Select
                items={CATEGORY_LABEL}
                value={category}
                onValueChange={(value) => setCategory(value as AlbumCategory)}
              >
                <SelectTrigger id="new-album-category" className="w-full">
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
              <Label htmlFor="new-album-date">Ngày cưới</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      id="new-album-date"
                      type="button"
                      variant="outline"
                      className="w-full justify-start font-normal"
                    />
                  }
                >
                  <CalendarIcon className="size-4" />
                  {eventDate ? eventDate.toLocaleDateString("vi-VN") : "Chọn ngày"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={setEventDate}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!title.trim() || !eventDate}>
              Tạo album
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
