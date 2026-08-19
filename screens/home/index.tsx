import { ContactSection } from "@/components/contact-section"
import { FeaturedAlbums } from "@/screens/home/components/featured-albums"
import { Hero, type HeroData } from "@/screens/home/components/hero"
import { PhilosophyStrip } from "@/screens/home/components/philosophy-strip"
import { RecentStories } from "@/screens/home/components/recent-stories"
import type { AlbumCardData } from "@/lib/albums"
import type { ContactInfo } from "@/lib/contact"
import type { VideoRow } from "@/lib/supabase/types"

export function HomeScreen({
  heroData,
  preWeddingAlbums,
  weddingAlbums,
  videos,
  recentAlbums,
  contact,
}: {
  heroData: HeroData
  preWeddingAlbums: AlbumCardData[]
  weddingAlbums: AlbumCardData[]
  videos: VideoRow[]
  recentAlbums: AlbumCardData[]
  contact: ContactInfo
}) {
  return (
    <main>
      <Hero heroData={heroData} />
      <PhilosophyStrip />
      <FeaturedAlbums
        preWeddingAlbums={preWeddingAlbums}
        weddingAlbums={weddingAlbums}
        videos={videos}
      />
      <RecentStories albums={recentAlbums} />
      <ContactSection contact={contact} />
    </main>
  )
}
