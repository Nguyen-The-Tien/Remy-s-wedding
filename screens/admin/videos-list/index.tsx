"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FullPageLoading } from "@/components/admin/full-page-loading"
import { TablePagination } from "@/components/admin/table-pagination"
import { useVideos } from "@/lib/queries/videos"
import { VideoFormDialog } from "@/screens/admin/videos-list/components/video-form-dialog"
import { VideoTable } from "@/screens/admin/videos-list/components/video-table"

const PAGE_SIZE = 20

export function VideosListScreen() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useVideos({ page, pageSize: PAGE_SIZE })
  const totalPages = Math.max(1, Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Videos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{data?.totalCount ?? 0} video</p>
        </div>
        <VideoFormDialog
          trigger={
            <Button>
              <Plus className="size-4" />
              Video mới
            </Button>
          }
        />
      </div>

      {isLoading ? (
        <FullPageLoading />
      ) : (
        <>
          <VideoTable videos={data?.videos ?? []} />
          <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
