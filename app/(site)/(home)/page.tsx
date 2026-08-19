import { HomeScreen } from "@/screens/home"
import type { HeroData } from "@/screens/home/components/hero"
import { toAlbumCardData } from "@/lib/albums"
import { resolveContactInfo } from "@/lib/contact"
import { getPublishedAlbumsByCategory, getRecentFeaturedAlbums } from "@/lib/data/albums"
import { listHeroImages } from "@/lib/data/hero-images"
import { getSiteSettings } from "@/lib/data/settings"
import { getPublishedVideos } from "@/lib/data/videos"
import { publicImageUrl } from "@/lib/r2-url"

export default async function Page() {
  const [settings, heroImages, preWeddingAlbumsRaw, weddingAlbumsRaw, videos, recentAlbums] =
    await Promise.all([
      getSiteSettings(),
      listHeroImages(),
      getPublishedAlbumsByCategory("pre_wedding"),
      getPublishedAlbumsByCategory("wedding"),
      getPublishedVideos(),
      getRecentFeaturedAlbums(8),
    ])

  const heroData: HeroData =
    settings.hero_background_mode === "images" && heroImages.length > 0
      ? { images: heroImages.map((image) => publicImageUrl(image.image_key)) }
      : { video: settings.hero_video_url || "/Webcover.mp4" }

  return (
    <HomeScreen
      heroData={heroData}
      preWeddingAlbums={preWeddingAlbumsRaw.slice(0, 4).map(toAlbumCardData)}
      weddingAlbums={weddingAlbumsRaw.slice(0, 8).map(toAlbumCardData)}
      videos={videos.slice(0, 4)}
      recentAlbums={recentAlbums.map(toAlbumCardData)}
      contact={resolveContactInfo(settings)}
    />
  )
}
