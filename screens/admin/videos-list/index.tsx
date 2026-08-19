"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FullPageLoading } from "@/components/admin/full-page-loading"
import { useVideos } from "@/lib/queries/videos"
import { VideoFormDialog } from "@/screens/admin/videos-list/components/video-form-dialog"
import { VideoTable } from "@/screens/admin/videos-list/components/video-table"

export function VideosListScreen() {
  const { data: videos, isLoading } = useVideos()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Videos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{videos?.length ?? 0} video</p>
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

      {isLoading ? <FullPageLoading /> : <VideoTable videos={videos ?? []} />}
    </div>
  )
}
