"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Contact, Film } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AddressMapField } from "@/components/admin/address-map-field"
import { FullPageLoading } from "@/components/admin/full-page-loading"
import { LoadingOverlay } from "@/components/admin/loading-overlay"
import { PhotoManager } from "@/components/admin/photo-manager"
import { SectionCard } from "@/components/admin/section-card"
import {
  useAddHeroImage,
  useDeleteHeroImage,
  useHeroImages,
  useUpdateHeroImageSortOrder,
} from "@/lib/queries/hero-images"
import { useSettings, useUpdateSettings } from "@/lib/queries/settings"
import { useUploadFile } from "@/lib/queries/uploads"
import { publicImageUrl } from "@/lib/r2-url"
import {
  contactSettingsSchema,
  fieldErrors,
  heroSettingsSchema,
  type ContactSettingsFormErrors,
  type HeroSettingsFormErrors,
} from "@/lib/admin/schemas"

type ContactForm = {
  email: string
  address: string
  phone: string
  zaloLink: string
  facebookLink: string
  instagramLink: string
}

type HeroForm = {
  heroBackgroundMode: "video" | "images"
  heroVideoUrl: string
}

export function SettingsScreen() {
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  const { data: heroImages } = useHeroImages()
  const addHeroImage = useAddHeroImage()
  const deleteHeroImage = useDeleteHeroImage()
  const updateHeroImageSortOrder = useUpdateHeroImageSortOrder()
  const uploadFile = useUploadFile()

  const [contactForm, setContactForm] = useState<ContactForm | null>(null)
  const [contactErrors, setContactErrors] = useState<ContactSettingsFormErrors>({})

  const [heroForm, setHeroForm] = useState<HeroForm | null>(null)
  const [heroErrors, setHeroErrors] = useState<HeroSettingsFormErrors>({})

  useEffect(() => {
    if (!settings) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContactForm({
      email: settings.email ?? "",
      address: settings.address ?? "",
      phone: settings.phone ?? "",
      zaloLink: settings.zalo_link ?? "",
      facebookLink: settings.facebook_link ?? "",
      instagramLink: settings.instagram_link ?? "",
    })
    setHeroForm({
      heroBackgroundMode: settings.hero_background_mode,
      heroVideoUrl: settings.hero_video_url ?? "",
    })
  }, [settings])

  if (isLoading || !contactForm || !heroForm) {
    return <FullPageLoading />
  }

  function handleSaveContact(e: FormEvent) {
    e.preventDefault()
    if (!contactForm || updateSettings.isPending) return
    const result = contactSettingsSchema.safeParse(contactForm)
    if (!result.success) {
      setContactErrors(fieldErrors(result.error.issues))
      return
    }
    setContactErrors({})
    updateSettings.mutate(
      {
        email: contactForm.email,
        address: contactForm.address,
        phone: contactForm.phone,
        zalo_link: contactForm.zaloLink,
        facebook_link: contactForm.facebookLink,
        instagram_link: contactForm.instagramLink,
      },
      {
        onSuccess: () => toast.success("Đã lưu thông tin liên hệ"),
        onError: () => toast.error("Không thể lưu"),
      }
    )
  }

  function handleSaveHero(e: FormEvent) {
    e.preventDefault()
    if (!heroForm || updateSettings.isPending) return
    const result = heroSettingsSchema.safeParse(heroForm)
    if (!result.success) {
      setHeroErrors(fieldErrors(result.error.issues))
      return
    }
    setHeroErrors({})
    updateSettings.mutate(
      {
        hero_background_mode: heroForm.heroBackgroundMode,
        hero_video_url: heroForm.heroVideoUrl,
      },
      {
        onSuccess: () => toast.success("Đã lưu nền trang chủ"),
        onError: () => toast.error("Không thể lưu"),
      }
    )
  }

  const displayHeroImages = (heroImages ?? []).map((img) => ({
    id: img.id,
    url: publicImageUrl(img.image_key),
  }))

  return (
    <div className="flex flex-col gap-6">
      <LoadingOverlay active={updateSettings.isPending || uploadFile.isPending} />
      <div>
        <h1 className="font-serif text-2xl text-foreground">Cài đặt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thông tin liên hệ và nền trang chủ
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSaveContact}>
          <SectionCard
            icon={Contact}
            title="Thông tin liên hệ"
            description="Hiển thị ở trang Liên hệ và chân trang"
            className="flex flex-col"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                  aria-invalid={Boolean(contactErrors.email)}
                />
                {contactErrors.email && (
                  <p className="text-xs text-destructive">{contactErrors.email}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={contactForm.phone}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, phone: e.target.value })
                  }
                  aria-invalid={Boolean(contactErrors.phone)}
                />
                {contactErrors.phone && (
                  <p className="text-xs text-destructive">{contactErrors.phone}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  value={contactForm.address}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, address: e.target.value })
                  }
                  aria-invalid={Boolean(contactErrors.address)}
                />
                {contactErrors.address && (
                  <p className="text-xs text-destructive">{contactErrors.address}</p>
                )}
                <AddressMapField
                  address={contactForm.address}
                  onAddressChange={(value) =>
                    setContactForm({ ...contactForm, address: value })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="zaloLink">Zalo</Label>
                <Input
                  id="zaloLink"
                  value={contactForm.zaloLink}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, zaloLink: e.target.value })
                  }
                  aria-invalid={Boolean(contactErrors.zaloLink)}
                />
                {contactErrors.zaloLink && (
                  <p className="text-xs text-destructive">{contactErrors.zaloLink}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="facebookLink">Facebook</Label>
                <Input
                  id="facebookLink"
                  value={contactForm.facebookLink}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, facebookLink: e.target.value })
                  }
                  aria-invalid={Boolean(contactErrors.facebookLink)}
                />
                {contactErrors.facebookLink && (
                  <p className="text-xs text-destructive">
                    {contactErrors.facebookLink}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="instagramLink">Instagram</Label>
                <Input
                  id="instagramLink"
                  value={contactForm.instagramLink}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, instagramLink: e.target.value })
                  }
                  aria-invalid={Boolean(contactErrors.instagramLink)}
                />
                {contactErrors.instagramLink && (
                  <p className="text-xs text-destructive">
                    {contactErrors.instagramLink}
                  </p>
                )}
              </div>

              <div className="flex justify-end border-t border-border pt-4">
                <Button type="submit" disabled={updateSettings.isPending}>
                  Lưu thông tin liên hệ
                </Button>
              </div>
            </div>
          </SectionCard>
        </form>

        <form onSubmit={handleSaveHero}>
          <SectionCard
            icon={Film}
            title="Nền trang chủ"
            description="Video hoặc ảnh slide hiển thị ở khu vực hero trang chủ"
            className="flex flex-col"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="heroBackgroundMode">Dùng ảnh slide</Label>
                  <p className="text-xs text-muted-foreground">
                    {heroForm.heroBackgroundMode === "images"
                      ? "Trang chủ đang hiển thị ảnh slide"
                      : "Trang chủ đang hiển thị video"}
                  </p>
                </div>
                <Switch
                  id="heroBackgroundMode"
                  checked={heroForm.heroBackgroundMode === "images"}
                  onCheckedChange={(checked) =>
                    setHeroForm({
                      ...heroForm,
                      heroBackgroundMode: checked ? "images" : "video",
                    })
                  }
                />
              </div>

              {heroForm.heroBackgroundMode === "video" ? (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="heroVideoUrl">Link video (YouTube/Vimeo)</Label>
                  <Input
                    id="heroVideoUrl"
                    value={heroForm.heroVideoUrl}
                    onChange={(e) =>
                      setHeroForm({ ...heroForm, heroVideoUrl: e.target.value })
                    }
                    placeholder="https://youtube.com/watch?v=..."
                    aria-invalid={Boolean(heroErrors.heroVideoUrl)}
                  />
                  {heroErrors.heroVideoUrl && (
                    <p className="text-xs text-destructive">
                      {heroErrors.heroVideoUrl}
                    </p>
                  )}
                </div>
              ) : (
                <PhotoManager
                  photos={displayHeroImages}
                  onAdd={(files) => {
                    const baseSortOrder = (heroImages ?? []).length
                    files.forEach(async (file, index) => {
                      try {
                        const { key } = await uploadFile.mutateAsync({
                          file,
                          kind: "hero-image",
                        })
                        await addHeroImage.mutateAsync({
                          imageKey: key,
                          sortOrder: baseSortOrder + index,
                        })
                      } catch {
                        toast.error("Không thể tải ảnh lên")
                      }
                    })
                  }}
                  onRemove={(id) => {
                    deleteHeroImage.mutate(id, {
                      onError: () => toast.error("Không thể xoá ảnh"),
                    })
                  }}
                  onMove={async (id, direction) => {
                    const images = heroImages ?? []
                    const index = images.findIndex((img) => img.id === id)
                    if (index === -1) return
                    const swapWith = direction === "up" ? index - 1 : index + 1
                    if (swapWith < 0 || swapWith >= images.length) return

                    try {
                      await updateHeroImageSortOrder.mutateAsync({
                        id: images[index].id,
                        sortOrder: images[swapWith].sort_order,
                      })
                      await updateHeroImageSortOrder.mutateAsync({
                        id: images[swapWith].id,
                        sortOrder: images[index].sort_order,
                      })
                    } catch {
                      toast.error("Không thể sắp xếp ảnh")
                    }
                  }}
                />
              )}

              <div className="flex justify-end border-t border-border pt-4">
                <Button type="submit" disabled={updateSettings.isPending}>
                  Lưu nền trang chủ
                </Button>
              </div>
            </div>
          </SectionCard>
        </form>
      </div>
    </div>
  )
}
