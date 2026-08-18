import "server-only"

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

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

function fileExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".")
  return dotIndex === -1 ? "" : fileName.slice(dotIndex)
}

export function imageUrl(key: string): string {
  return `${process.env.R2_PUBLIC_BASE_URL}/${key}`
}

export function buildPhotoKey(albumSlug: string, fileName: string): string {
  return `album-photos/${albumSlug}/${crypto.randomUUID()}${fileExtension(fileName)}`
}

export function buildHeroKey(fileName: string): string {
  return `site-assets/hero${fileExtension(fileName)}`
}

export function buildHeroImageKey(fileName: string): string {
  return `site-assets/hero-images/${crypto.randomUUID()}${fileExtension(fileName)}`
}

export async function presignUpload(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(r2Client(), command, { expiresIn: 300 })
}

export async function deleteObject(key: string): Promise<void> {
  await r2Client().send(
    new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key })
  )
}
