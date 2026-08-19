"use client"

import { useState } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FullPageLoading } from "@/components/admin/full-page-loading"
import { TablePagination } from "@/components/admin/table-pagination"
import { CATEGORY_LABEL, type AlbumCategory } from "@/lib/albums"
import { useAlbums } from "@/lib/queries/albums"
import { AlbumTable } from "@/screens/admin/albums-list/components/album-table"
import { NewAlbumDialog } from "@/screens/admin/albums-list/components/new-album-dialog"

const FILTERS: { value: AlbumCategory | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pre_wedding", label: CATEGORY_LABEL.pre_wedding },
  { value: "wedding", label: CATEGORY_LABEL.wedding },
]

const PAGE_SIZE = 20

export function AlbumsListScreen() {
  const [filter, setFilter] = useState<AlbumCategory | "all">("all")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useAlbums({
    page,
    pageSize: PAGE_SIZE,
    category: filter,
  })
  const totalPages = Math.max(1, Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Albums</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.totalCount ?? 0} album
          </p>
        </div>
        <NewAlbumDialog />
      </div>

      <Tabs
        value={filter}
        onValueChange={(value) => {
          setFilter(value as AlbumCategory | "all")
          setPage(1)
        }}
      >
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <FullPageLoading />
      ) : (
        <>
          <AlbumTable albums={data?.albums ?? []} />
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
