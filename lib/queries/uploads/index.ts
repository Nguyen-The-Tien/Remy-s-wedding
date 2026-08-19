import { useMutation } from "@tanstack/react-query"

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
  const presignRes = await http.post<{ uploadUrl: string; key: string }>(
    "/uploads/presign",
    {
      kind,
      fileName: file.name,
      contentType: file.type,
      ...(kind === "album-photo" ? { albumSlug } : {}),
    }
  )
  const { uploadUrl, key } = presignRes.data

  await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  })

  return { key, url: publicImageUrl(key) }
}

export function useUploadFile() {
  return useMutation({ mutationFn: uploadFile })
}
