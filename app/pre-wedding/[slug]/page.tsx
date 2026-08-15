import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getAlbumBySlug } from "@/lib/mock-albums"
import { AlbumScreen } from "@/screens/album"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const album = getAlbumBySlug(slug)

  if (!album || album.category !== "pre_wedding") return {}

  return {
    title: `${album.title} — Remy's`,
    description: `${album.location} · ${album.date}`,
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const album = getAlbumBySlug(slug)

  if (!album || album.category !== "pre_wedding") notFound()

  return <AlbumScreen album={album} />
}
