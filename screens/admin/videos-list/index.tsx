"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useAdminData } from "@/lib/admin/mock-store"
import { VideoFormDialog } from "@/screens/admin/videos-list/components/video-form-dialog"
import { VideoTable } from "@/screens/admin/videos-list/components/video-table"

export function VideosListScreen() {
  const { videos } = useAdminData()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Videos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {videos.length} video
          </p>
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

      <VideoTable videos={videos} />
    </div>
  )
}
