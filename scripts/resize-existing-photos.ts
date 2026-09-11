import { config } from "dotenv"
config()

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import sharp from "sharp"

import { computeResizedDimensions } from "../lib/image-resize"
import { createAdminClient } from "../lib/supabase/admin"

const MAX_DIMENSION = 2000
const QUALITY = 82
const APPLY = process.argv.includes("--apply")

function r2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

async function collectImageKeys(): Promise<string[]> {
  const supabase = createAdminClient()

  const [photos, albums, heroImages] = await Promise.all([
    supabase.from("album_photos").select("image_key"),
    supabase.from("albums").select("cover_image_key"),
    supabase.from("hero_images").select("image_key"),
  ])
  if (photos.error) throw photos.error
  if (albums.error) throw albums.error
  if (heroImages.error) throw heroImages.error

  const keys = [
    ...photos.data.map((row) => row.image_key),
    ...albums.data.map((row) => row.cover_image_key).filter((key): key is string => Boolean(key)),
    ...heroImages.data.map((row) => row.image_key),
  ]
  return [...new Set(keys)]
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks)
}

function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)}KB`
}

async function main() {
  const client = r2Client()
  const bucket = process.env.R2_BUCKET_NAME!
  const keys = (await collectImageKeys()).filter((key) => /\.jpe?g$/i.test(key))

  console.log(`Found ${keys.length} JPEG image(s) referenced in the database.`)
  console.log(APPLY ? "Mode: APPLY — will overwrite R2 objects.\n" : "Mode: DRY RUN — no writes.\n")

  let resizable = 0
  let skipped = 0
  let originalBytes = 0
  let newBytes = 0

  for (const key of keys) {
    const original = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
    const buffer = await streamToBuffer(original.Body as NodeJS.ReadableStream)
    const { width = 0, height = 0 } = await sharp(buffer).metadata()
    const target = computeResizedDimensions(width, height, MAX_DIMENSION)

    if (target.width === width && target.height === height) {
      skipped++
      continue
    }

    const resized = await sharp(buffer)
      .resize(target.width, target.height)
      .jpeg({ quality: QUALITY })
      .toBuffer()

    resizable++
    originalBytes += buffer.length
    newBytes += resized.length
    console.log(
      `${key}: ${width}x${height} (${formatKB(buffer.length)}) -> ${target.width}x${target.height} (${formatKB(resized.length)})`
    )

    if (APPLY) {
      await client.send(
        new PutObjectCommand({ Bucket: bucket, Key: key, Body: resized, ContentType: "image/jpeg" })
      )
    }
  }

  console.log(`\nResizable: ${resizable}, already small enough: ${skipped}`)
  if (resizable > 0) {
    console.log(
      `Total: ${(originalBytes / 1024 / 1024).toFixed(1)}MB -> ${(newBytes / 1024 / 1024).toFixed(1)}MB`
    )
  }
  if (!APPLY && resizable > 0) {
    console.log("\nDry run only — re-run with --apply to overwrite the originals on R2.")
  }
}

main().catch((err) => {
  console.error("\nMigration FAILED:", err)
  process.exit(1)
})
