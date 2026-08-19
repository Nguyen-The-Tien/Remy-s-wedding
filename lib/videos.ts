import { getYouTubeId } from "@/lib/utils"

export const VIDEO_CATEGORY_LABEL = "Video cưới"
export const VIDEO_CATEGORY_TITLE = "Cảm xúc, dựng thành chuyển động"

export function videoThumbnail(youtubeUrl: string) {
  return `https://img.youtube.com/vi/${getYouTubeId(youtubeUrl)}/hqdefault.jpg`
}
