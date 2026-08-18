import { describe, expect, it } from "vitest"
import { buildHeroKey, buildPhotoKey, imageUrl } from "./r2"

describe("imageUrl", () => {
  it("joins the public base URL and the key", () => {
    process.env.R2_PUBLIC_BASE_URL = "https://pub-abc123.r2.dev"
    expect(imageUrl("album-photos/foo/bar.jpg")).toBe(
      "https://pub-abc123.r2.dev/album-photos/foo/bar.jpg"
    )
  })
})

describe("buildPhotoKey", () => {
  it("nests under album-photos/<slug>/ with a random name and the original extension", () => {
    const key = buildPhotoKey("linh-minh-tam-dao", "IMG_0001.JPG")
    expect(key).toMatch(
      /^album-photos\/linh-minh-tam-dao\/[0-9a-f-]{36}\.JPG$/
    )
  })

  it("handles a filename with no extension", () => {
    const key = buildPhotoKey("linh-minh-tam-dao", "IMG_0001")
    expect(key).toMatch(/^album-photos\/linh-minh-tam-dao\/[0-9a-f-]{36}$/)
  })
})

describe("buildHeroKey", () => {
  it("always resolves to site-assets/hero.<ext>", () => {
    expect(buildHeroKey("background-video.mp4")).toBe("site-assets/hero.mp4")
  })
})
