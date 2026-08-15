import { ContactSection } from "@/components/contact-section"
import { FeaturedAlbums } from "@/screens/home/components/featured-albums"
import { Hero } from "@/screens/home/components/hero"
import { PhilosophyStrip } from "@/screens/home/components/philosophy-strip"
import { RecentStories } from "@/screens/home/components/recent-stories"

export function HomeScreen() {
  return (
    <main>
      <Hero />
      <PhilosophyStrip />
      <FeaturedAlbums />
      <RecentStories />
      <ContactSection />
    </main>
  )
}
