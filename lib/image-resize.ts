const RESIZABLE_TYPES = new Set(["image/jpeg"])

// Camera photos land at full sensor resolution (multi-MB); browsers then
// have to download the original at display size. Re-encoding at upload
// time keeps files web-sized without needing a server-side image service.
// Only JPEGs are handled — PNG/WebP pass through untouched to avoid
// flattening transparency when re-encoding to JPEG.
export async function resizeImageFile(
  file: File,
  { maxDimension = 2000, quality = 0.82 } = {}
): Promise<File> {
  if (!RESIZABLE_TYPES.has(file.type)) return file

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" })
  const { width, height } = computeResizedDimensions(bitmap.width, bitmap.height, maxDimension)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  )
  if (!blob) return file

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg"
  return new File([blob], name, { type: "image/jpeg" })
}

export function computeResizedDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  const longestSide = Math.max(width, height)
  if (longestSide <= maxDimension) return { width, height }

  const scale = maxDimension / longestSide
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}
