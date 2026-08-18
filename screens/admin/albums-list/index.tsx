"use client"

import { useState } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FullPageLoading } from "@/components/admin/full-page-loading"
import { CATEGORY_LABEL, type AlbumCategory } from "@/lib/mock-albums"
import { useAlbums } from "@/lib/queries/albums"
import { AlbumTable } from "@/screens/admin/albums-list/components/album-table"
import { NewAlbumDialog } from "@/screens/admin/albums-list/components/new-album-dialog"

const FILTERS: { value: AlbumCategory | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pre_wedding", label: CATEGORY_LABEL.pre_wedding },
  { value: "wedding", label: CATEGORY_LABEL.wedding },
]

export function AlbumsListScreen() {
  const { data: albums, isLoading } = useAlbums()
  const [filter, setFilter] = useState<AlbumCategory | "all">("all")

  const filtered =
    !albums ? [] : filter === "all" ? albums : albums.filter((a) => a.category === filter)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Albums</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {albums?.length ?? 0} album
          </p>
        </div>
        <NewAlbumDialog />
      </div>

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as AlbumCategory | "all")}
      >
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? <FullPageLoading /> : <AlbumTable albums={filtered} />}
    </div>
  )
}
