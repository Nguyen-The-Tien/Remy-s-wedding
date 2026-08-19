import { ContactSection } from "@/components/contact-section"
import { buildAlbumCredits, type AlbumCardData, type AlbumDetailData } from "@/lib/albums"
import type { ContactInfo } from "@/lib/contact"
import { AlbumCredits } from "@/screens/album/components/album-credits"
import { AlbumTitle } from "@/screens/album/components/album-title"
import { HighlightVideo } from "@/screens/album/components/highlight-video"
import { PhotoLightbox } from "@/screens/album/components/photo-lightbox"
import { RelatedAlbums } from "@/screens/album/components/related-albums"

export function AlbumScreen({
  album,
  related,
  contact,
}: {
  album: AlbumDetailData
  related: AlbumCardData[]
  contact: ContactInfo
}) {
  const listHref = album.category === "pre_wedding" ? "/pre-wedding" : "/wedding"
  const credits = buildAlbumCredits(album.location)

  return (
    <main>
      <AlbumTitle album={album} listHref={listHref} />

      {album.highlightVideoUrl && (
        <section className="pb-16 md:pb-20">
          <div className="mx-auto max-w-[1440px] px-6 md:px-10">
            <HighlightVideo url={album.highlightVideoUrl} title={album.title} />
          </div>
        </section>
      )}

      <section className="pb-20 md:pb-28">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <PhotoLightbox photos={album.photos} title={album.title} />
        </div>
      </section>

      <AlbumCredits credits={credits} />

      <RelatedAlbums albums={related} />

      <ContactSection contact={contact} />
    </main>
  )
}
