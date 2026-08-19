"use client"

import { Film, Images, Sparkles } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { FullPageLoading } from "@/components/admin/full-page-loading"
import { CATEGORY_LABEL } from "@/lib/albums"
import { useAdminStats } from "@/lib/queries/admin-stats"

const CATEGORY_ICON = {
  pre_wedding: Sparkles,
  wedding: Images,
} as const

export function DashboardScreen() {
  const { data: stats, isLoading } = useAdminStats()

  if (isLoading || !stats) {
    return <FullPageLoading />
  }

  const albumStats = (["pre_wedding", "wedding"] as const).map((category) => ({
    key: category,
    label: CATEGORY_LABEL[category],
    icon: CATEGORY_ICON[category],
    total: stats.albums[category].total,
    published: stats.albums[category].published,
  }))

  const cardStats = [
    ...albumStats,
    {
      key: "video",
      label: "Video cưới",
      icon: Film,
      total: stats.videos.total,
      published: stats.videos.published,
    },
  ]

  const publishedCount = stats.albums.published
  const draftCount = stats.albums.total - publishedCount

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Tổng quan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {stats.albums.total} album · {stats.videos.total} video · {publishedCount} đã đăng
          · {draftCount} bản nháp
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cardStats.map((stat) => {
          const Icon = stat.icon
          const draft = stat.total - stat.published
          return (
            <div
              key={stat.key}
              className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground/70">
                  <Icon className="size-4" />
                </div>
              </div>
              <p className="mt-3 font-serif text-3xl text-foreground">{stat.total}</p>
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
