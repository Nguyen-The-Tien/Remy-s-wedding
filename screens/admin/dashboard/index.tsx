"use client"

import { Film, Images, Sparkles } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { CATEGORY_LABEL } from "@/lib/mock-albums"
import { useAdminData } from "@/lib/admin/mock-store"

const CATEGORY_ICON = {
  pre_wedding: Sparkles,
  wedding: Images,
} as const

export function DashboardScreen() {
  const { albums, videos } = useAdminData()

  const albumStats = (["pre_wedding", "wedding"] as const).map((category) => {
    const inCategory = albums.filter((a) => a.category === category)
    return {
      key: category,
      label: CATEGORY_LABEL[category],
      icon: CATEGORY_ICON[category],
      total: inCategory.length,
      published: inCategory.filter((a) => a.isPublished).length,
    }
  })

  const stats = [
    ...albumStats,
    {
      key: "video",
      label: "Video cưới",
      icon: Film,
      total: videos.length,
      published: videos.filter((v) => v.isPublished).length,
    },
  ]

  const publishedCount = albums.filter((a) => a.isPublished).length
  const draftCount = albums.length - publishedCount

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Tổng quan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {albums.length} album · {videos.length} video · {publishedCount} đã
          đăng · {draftCount} bản nháp
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          const draft = stat.total - stat.published
          return (
            <div
              key={stat.key}
              className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {stat.label}
                </span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground/70">
                  <Icon className="size-4" />
                </div>
              </div>
              <p className="mt-3 font-serif text-3xl text-foreground">
                {stat.total}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.published} đã đăng
                {draft > 0 && ` · ${draft} bản nháp`}
              </p>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/admin/albums" />}>
          Quản lý albums
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/admin/videos" />}
        >
          Quản lý videos
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/admin/settings" />}
        >
          Cài đặt trang
        </Button>
      </div>
    </div>
  )
}
