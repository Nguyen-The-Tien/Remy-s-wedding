import Link from "next/link"

import { albumHref, type AlbumCardData } from "@/lib/albums"

export function AlbumLink({
  album,
  className,
  children,
}: {
  album: Pick<AlbumCardData, "category" | "slug">
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link href={albumHref(album)} className={className}>
      {children}
    </Link>
  )
}
