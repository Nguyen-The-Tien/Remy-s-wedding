import { useMutation } from "@tanstack/react-query"

import { resizeImageFile } from "@/lib/image-resize"
import { http } from "@/lib/queries/http"
import { publicImageUrl } from "@/lib/r2-url"

type UploadKind = "album-photo" | "hero-image" | "hero-video"

type UploadInput = {
  file: File
  kind: UploadKind
  albumSlug?: string
}

type UploadResult = {
  key: string
  url: string
}

async function uploadFile({ file, kind, albumSlug }: UploadInput): Promise<UploadResult> {
  const payload = kind === "hero-video" ? file : await resizeImageFile(file)

  const presignRes = await http.post<{ uploadUrl: string; key: string }>(
    "/uploads/presign",
    {
      kind,
      fileName: payload.name,
      contentType: payload.type,
      ...(kind === "album-photo" ? { albumSlug } : {}),
    }
  )
  const { uploadUrl, key } = presignRes.data

  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": payload.type },
    body: payload,
  })

  return { key, url: publicImageUrl(key) }
}

export function useUploadFile() {
  return useMutation({ mutationFn: uploadFile })
}
