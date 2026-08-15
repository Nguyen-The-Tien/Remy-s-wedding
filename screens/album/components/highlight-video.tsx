import { getYouTubeId } from "@/lib/utils"

export function HighlightVideo({ url, title }: { url: string; title: string }) {
  const id = getYouTubeId(url)

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-neutral-900">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={`Video highlight — ${title}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  )
}
