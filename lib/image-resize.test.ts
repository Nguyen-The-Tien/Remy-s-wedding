import { describe, expect, it } from "vitest"
import { computeResizedDimensions } from "./image-resize"

describe("computeResizedDimensions", () => {
  it("returns original dimensions when already within max", () => {
    expect(computeResizedDimensions(800, 600, 2000)).toEqual({
      width: 800,
      height: 600,
    })
  })

  it("scales down a landscape image so the longest side equals max", () => {
    expect(computeResizedDimensions(4000, 3000, 2000)).toEqual({
      width: 2000,
      height: 1500,
    })
  })

  it("scales down a portrait image so the longest side equals max", () => {
    expect(computeResizedDimensions(3000, 4000, 2000)).toEqual({
      width: 1500,
      height: 2000,
    })
  })

  it("rounds the scaled dimension to the nearest integer", () => {
    expect(computeResizedDimensions(4003, 3000, 2000)).toEqual({
      width: 2000,
      height: 1499,
    })
  })

  it("does not upscale an image smaller than max", () => {
    expect(computeResizedDimensions(500, 400, 2000)).toEqual({
      width: 500,
      height: 400,
    })
  })
})
