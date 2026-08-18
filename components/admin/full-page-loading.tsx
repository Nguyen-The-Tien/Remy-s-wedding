import { Loader2 } from "lucide-react"

export function FullPageLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Đang tải...</p>
    </div>
  )
}
