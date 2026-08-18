import { describe, expect, it } from "vitest"
import { publicImageUrl } from "./r2-url"

describe("publicImageUrl", () => {
  it("joins the public base URL and the key", () => {
    process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL = "https://pub-abc123.r2.dev"
    expect(publicImageUrl("album-photos/foo/bar.jpg")).toBe(
      "https://pub-abc123.r2.dev/album-photos/foo/bar.jpg"
    )
  })
})
