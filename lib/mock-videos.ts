import { getYouTubeId } from "@/lib/utils"

export type VideoEntry = {
  id: string
  title: string
  location: string
  /** ISO date (yyyy-MM-dd) */
  date: string
  youtubeUrl: string
}

export const VIDEO_CATEGORY_LABEL = "Video cưới"
export const VIDEO_CATEGORY_TITLE = "Cảm xúc, dựng thành chuyển động"

export const mockVideos: VideoEntry[] = [
  {
    id: "7",
    title: "Trang & Hiếu",
    location: "Phú Quốc",
    date: "2026-03-15",
    youtubeUrl: "https://www.youtube.com/watch?v=phz8Yqdj7sA",
  },
  {
    id: "8",
    title: "Mai & Tuấn",
    location: "Sa Pa",
    date: "2025-10-15",
    youtubeUrl: "https://www.youtube.com/watch?v=phz8Yqdj7sA",
  },
  {
    id: "9",
    title: "Hương & Long",
    location: "Vũng Tàu",
    date: "2025-08-15",
    youtubeUrl: "https://www.youtube.com/watch?v=phz8Yqdj7sA",
  },
  {
    id: "12",
    title: "Vy & Đạt",
    location: "Đà Nẵng",
    date: "2025-05-15",
    youtubeUrl: "https://www.youtube.com/watch?v=phz8Yqdj7sA",
  },
  {
    id: "15",
    title: "Linh & Phong",
    location: "Nha Trang",
    date: "2025-02-15",
    youtubeUrl: "https://www.youtube.com/watch?v=phz8Yqdj7sA",
  },
]

export function videoThumbnail(youtubeUrl: string) {
  return `https://img.youtube.com/vi/${getYouTubeId(youtubeUrl)}/hqdefault.jpg`
}
