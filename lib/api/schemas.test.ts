import { describe, expect, it } from "vitest"
import {
  createAlbumSchema,
  presignRequestSchema,
  updateSettingsSchema,
} from "./schemas"

describe("presignRequestSchema", () => {
  it("requires albumSlug for kind=album-photo", () => {
    const result = presignRequestSchema.safeParse({
      kind: "album-photo",
      fileName: "a.jpg",
      contentType: "image/jpeg",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a non-image contentType for kind=hero-image", () => {
    const result = presignRequestSchema.safeParse({
      kind: "hero-image",
      fileName: "a.mp4",
      contentType: "video/mp4",
    })
    expect(result.success).toBe(false)
  })

  it("accepts a valid hero-video request", () => {
    const result = presignRequestSchema.safeParse({
      kind: "hero-video",
      fileName: "bg.mp4",
      contentType: "video/mp4",
    })
    expect(result.success).toBe(true)
  })
})

describe("createAlbumSchema", () => {
  it("rejects an unknown category", () => {
    const result = createAlbumSchema.safeParse({
      category: "video",
      title: "Test",
      slug: "test",
    })
    expect(result.success).toBe(false)
  })

  it("accepts a minimal valid payload", () => {
    const result = createAlbumSchema.safeParse({
      category: "wedding",
      title: "Test",
      slug: "test",
    })
    expect(result.success).toBe(true)
  })
})

describe("updateSettingsSchema", () => {
  it("accepts a partial patch", () => {
    const result = updateSettingsSchema.safeParse({ email: "a@b.com" })
    expect(result.success).toBe(true)
  })

  it("rejects an invalid hero_background_mode", () => {
    const result = updateSettingsSchema.safeParse({
      hero_background_mode: "slideshow",
    })
    expect(result.success).toBe(false)
  })
})
