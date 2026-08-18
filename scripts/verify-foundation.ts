import { config } from "dotenv"
config({ path: ".env.local" })

import { randomUUID } from "node:crypto"

import {
  addPhoto,
  deleteAlbum,
  createAlbum,
  getPublishedAlbumBySlug,
  updateAlbum,
} from "../lib/data/albums"
import {
  addHeroImage,
  deleteHeroImage,
  listHeroImages,
} from "../lib/data/hero-images"
import { getSiteSettings, updateSiteSettings } from "../lib/data/settings"
import {
  createVideo,
  deleteVideo,
  getPublishedVideos,
} from "../lib/data/videos"
import { buildPhotoKey, imageUrl, presignUpload } from "../lib/r2"

async function main() {
  console.log("1. Creating a draft (unpublished) album...")
  const slug = `verify-${randomUUID()}`
  const album = await createAlbum({
    category: "wedding",
    title: "Verify Script",
    slug,
  })
  console.log("   created:", album.id)

  console.log("2. Uploading a test photo to R2 via a presigned URL...")
  const key = buildPhotoKey(slug, "test.txt")
  const uploadUrl = await presignUpload(key, "text/plain")
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    body: "hello from verify script",
    headers: { "Content-Type": "text/plain" },
  })
  if (!putRes.ok) throw new Error(`R2 PUT failed: ${putRes.status}`)
  await addPhoto(album.id, key, 0)
  console.log("   uploaded key:", key)

  console.log("3. Confirming the unpublished album is NOT publicly readable...")
  const beforePublish = await getPublishedAlbumBySlug(slug)
  if (beforePublish !== null) {
    throw new Error("expected null for an unpublished album (RLS should block it)")
  }

  console.log("4. Publishing the album...")
  await updateAlbum(album.id, { is_published: true, location: "Tam Đảo" })
  const afterPublish = await getPublishedAlbumBySlug(slug)
  if (!afterPublish || afterPublish.photos.length !== 1) {
    throw new Error("expected a published album with exactly 1 photo")
  }
  console.log("   public read OK, photo URL:", imageUrl(afterPublish.photos[0].image_key))

  console.log("5. Fetching the uploaded object over its public URL...")
  const getRes = await fetch(imageUrl(key))
  if (!getRes.ok) throw new Error(`R2 public GET failed: ${getRes.status}`)
  const body = await getRes.text()
  if (body !== "hello from verify script") {
    throw new Error(`unexpected object content: ${body}`)
  }

  console.log("6. Checking site_settings read/write...")
  const settings = await getSiteSettings()
  await updateSiteSettings({ email: settings.email ?? "hello@remys.vn" })

  console.log("7. Checking videos (create, public-read gating, delete)...")
  const video = await createVideo({
    title: "Verify Video",
    location: "Đà Lạt",
    eventDate: "2026-01-01",
    youtubeUrl: "https://www.youtube.com/watch?v=abc123",
  })
  const videosBeforePublish = await getPublishedVideos()
  if (videosBeforePublish.some((v) => v.id === video.id)) {
    throw new Error("expected unpublished video to be excluded from public reads")
  }
  await deleteVideo(video.id)

  console.log("8. Checking hero_images (add, public list, delete)...")
  const heroKey = buildPhotoKey(slug, "hero-test.txt")
  const heroUploadUrl = await presignUpload(heroKey, "text/plain")
  const heroPut = await fetch(heroUploadUrl, {
    method: "PUT",
    body: "hero image bytes",
    headers: { "Content-Type": "text/plain" },
  })
  if (!heroPut.ok) throw new Error(`R2 PUT (hero) failed: ${heroPut.status}`)
  const heroImage = await addHeroImage(heroKey, 0)
  const heroImages = await listHeroImages()
  if (!heroImages.some((h) => h.id === heroImage.id)) {
    throw new Error("expected hero image to be publicly listable")
  }
  await deleteHeroImage(heroImage.id)
  const heroGetAfterDelete = await fetch(imageUrl(heroKey))
  if (heroGetAfterDelete.ok) {
    throw new Error("expected the hero R2 object to be deleted")
  }

  console.log("9. Deleting the album (should cascade rows + clean up the R2 object)...")
  await deleteAlbum(album.id)
  const getAfterDelete = await fetch(imageUrl(key))
  if (getAfterDelete.ok) {
    throw new Error("expected the R2 object to be deleted after album delete")
  }

  console.log("\nAll checks passed.")
}

main().catch((err) => {
  console.error("\nVerification FAILED:", err)
  process.exit(1)
})
