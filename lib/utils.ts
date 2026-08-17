import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getYouTubeId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{6,})/)
  return match ? match[1] : url
}

/** Slugifies a string: strips Vietnamese diacritics, lowercases, and joins words with hyphens. */
export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

/** Builds a slug from a title and an ISO date (yyyy-MM-dd), e.g. "linh-minh-2026-03-15". */
export function composeSlug(title: string, eventDateIso: string) {
  const base = slugify(title)
  return eventDateIso ? `${base}-${eventDateIso}` : base
}

/** Formats a Date as an ISO date string (yyyy-MM-dd), in local time. */
export function toIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Parses an ISO date string (yyyy-MM-dd) as a local Date. */
export function parseIsoDate(dateIso: string): Date | undefined {
  if (!dateIso) return undefined
  const [year, month, day] = dateIso.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

/** Formats an ISO date string (yyyy-MM-dd) as dd/MM/yyyy. */
export function formatDdMmYyyy(dateIso: string) {
  const date = parseIsoDate(dateIso)
  if (!date) return "—"
  return date.toLocaleDateString("vi-VN")
}
