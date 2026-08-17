"use client"

import { useState, type FormEvent } from "react"
import { Contact, Film } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AddressMapField } from "@/components/admin/address-map-field"
import { PhotoManager } from "@/components/admin/photo-manager"
import { SectionCard } from "@/components/admin/section-card"
import { useAdminData } from "@/lib/admin/mock-store"
import {
  contactSettingsSchema,
  fieldErrors,
  heroSettingsSchema,
  type ContactSettingsFormErrors,
  type HeroSettingsFormErrors,
} from "@/lib/admin/schemas"
import type {
  ContactSettingsValues,
  HeroSettingsValues,
} from "@/lib/admin/types"

export function SettingsScreen() {
  const {
    settings,
    updateSettings,
    addHeroImages,
    removeHeroImage,
    moveHeroImage,
  } = useAdminData()

  const [contactForm, setContactForm] = useState<ContactSettingsValues>(() => ({
    email: settings.email,
    address: settings.address,
    zaloLink: settings.zaloLink,
    facebookLink: settings.facebookLink,
    instagramLink: settings.instagramLink,
  }))
  const [contactErrors, setContactErrors] = useState<ContactSettingsFormErrors>(
    {}
  )

  const [heroForm, setHeroForm] = useState<HeroSettingsValues>(() => ({
    heroBackgroundMode: settings.heroBackgroundMode,
    heroVideoUrl: settings.heroVideoUrl,
  }))
  const [heroErrors, setHeroErrors] = useState<HeroSettingsFormErrors>({})

  function handleSaveContact(e: FormEvent) {
    e.preventDefault()
    const result = contactSettingsSchema.safeParse(contactForm)
    if (!result.success) {
      setContactErrors(fieldErrors(result.error.issues))
      return
    }
    setContactErrors({})
    updateSettings(contactForm)
    toast.success("Đã lưu thông tin liên hệ")
  }

  function handleSaveHero(e: FormEvent) {
    e.preventDefault()
    const result = heroSettingsSchema.safeParse(heroForm)
    if (!result.success) {
      setHeroErrors(fieldErrors(result.error.issues))
      return
    }
    setHeroErrors({})
    updateSettings(heroForm)
    toast.success("Đã lưu nền trang chủ")
  }

  return (
    <div className="flex flex-col gap-6">
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
                  <p className="text-xs text-destructive">
                    {contactErrors.email}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  value={contactForm.address}
                  onChange={(e) =>
                    setContactForm({
                      ...contactForm,
                      address: e.target.value,
                    })
                  }
                  aria-invalid={Boolean(contactErrors.address)}
                />
                {contactErrors.address && (
                  <p className="text-xs text-destructive">
                    {contactErrors.address}
                  </p>
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
                    setContactForm({
                      ...contactForm,
                      zaloLink: e.target.value,
                    })
                  }
                  aria-invalid={Boolean(contactErrors.zaloLink)}
                />
                {contactErrors.zaloLink && (
                  <p className="text-xs text-destructive">
                    {contactErrors.zaloLink}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="facebookLink">Facebook</Label>
                <Input
                  id="facebookLink"
                  value={contactForm.facebookLink}
                  onChange={(e) =>
                    setContactForm({
                      ...contactForm,
                      facebookLink: e.target.value,
                    })
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
                    setContactForm({
                      ...contactForm,
                      instagramLink: e.target.value,
                    })
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
                <Button type="submit">Lưu thông tin liên hệ</Button>
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
                  <Label htmlFor="heroVideoUrl">
                    Link video (YouTube/Vimeo)
                  </Label>
                  <Input
                    id="heroVideoUrl"
                    value={heroForm.heroVideoUrl}
                    onChange={(e) =>
                      setHeroForm({
                        ...heroForm,
                        heroVideoUrl: e.target.value,
                      })
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
                  photos={settings.heroImages}
                  onAdd={(files) =>
                    addHeroImages(
                      files.map((file) => URL.createObjectURL(file))
                    )
                  }
                  onRemove={removeHeroImage}
                  onMove={moveHeroImage}
                />
              )}

              <div className="flex justify-end border-t border-border pt-4">
                <Button type="submit">Lưu nền trang chủ</Button>
              </div>
            </div>
          </SectionCard>
        </form>
      </div>
    </div>
  )
}
