import Link from "next/link"

import { albumHref } from "@/lib/mock-albums"
import type { MockAlbum } from "@/lib/mock-albums"

export function AlbumLink({
  album,
  className,
  children,
}: {
  album: MockAlbum
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link href={albumHref(album)} className={className}>
      {children}
    </Link>
  )
}
