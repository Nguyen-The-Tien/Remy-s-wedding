# Admin UI Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the admin panel's mock data layer (`lib/admin/mock-store.tsx`, seeded
from `lib/mock-albums.ts`/`lib/mock-videos.ts`) with real data from the `/api/*` routes
built in the previous plan, fetched client-side via `axios` + `@tanstack/react-query`
hooks organized in a `lib/queries/<domain>/` folder per domain. Photo/cover/hero-image
uploads switch from fake `URL.createObjectURL()` blobs to real presigned uploads to R2.

**Architecture:** Every admin screen keeps its current JSX/layout — only the data
source changes. Each domain (`albums`, `videos`, `hero-images`, `settings`) gets one
`lib/queries/<domain>/index.ts` file exporting a `use<Domain>()` list-query hook plus one
mutation hook per write operation; every mutation invalidates the domain's list query key
on success so the UI refreshes automatically. A single shared `lib/queries/uploads/index.ts`
upload hook (presign → PUT to R2 → return `{ key, url }`) is reused by every screen that
uploads a file. `QueryProvider` (new) wraps the admin layout **alongside** the existing
`AdminDataProvider`, so screens migrate one at a time without breaking the ones not yet
converted; the last task removes `AdminDataProvider` once nothing references it.

Two behavior changes from the mock version, decided with the project owner before this
plan was written:
1. **Hero background video is a pasted YouTube/Vimeo URL**, not an uploaded file — this
   plan renames `site_settings.hero_video_key` to `hero_video_url` and removes the
   now-unnecessary `hero-video` upload path added in the previous plan.
2. **Album photos save instantly** (upload + DB write on every add/remove/reorder), not
   batched into the album's "Lưu thay đổi" button — matching how hero images already
   behave. The save button now covers only the album's scalar fields (title, slug,
   category, location, event date, highlight video URL, cover image).

**Tech Stack:** `axios` and `@tanstack/react-query` (already installed in the previous
plan), Next.js 16 App Router, Vitest (already set up).

**Spec:** `docs/superpowers/specs/2026-08-16-backend-supabase-r2-design.md` (background
only — this plan's actual contract is the `/api/*` routes from
`docs/superpowers/plans/2026-08-18-admin-auth-api-routes.md`, which this plan consumes
verbatim except for the `hero_video_key` → `hero_video_url` correction in Task 1).

## Global Constraints

- Every screen keeps calling through a `lib/queries/<domain>/` hook — no component calls
  `axios`/`fetch` directly, and no component imports `lib/data/*` or `lib/supabase/*`
  (those are server-only; this plan is entirely client-side).
- Every mutation hook invalidates its domain's list query key (from `lib/queries/keys.ts`)
  in `onSuccess`, so screens never manually refetch or manage local copies of server data.
- R2 object keys are resolved to displayable URLs only via `publicImageUrl()`
  (`lib/r2-url.ts`, Task 1) — never construct an R2 URL by hand in a component.
- `lib/admin/schemas.ts` (zod, client-form validation) and the `*FormValues`/`*FormErrors`
  types in `lib/admin/types.ts` are **kept** — they validate raw form input before it
  becomes a mutation payload, which is a different concern from the server-side
  `lib/api/schemas.ts` validation. Only the mock **data** types (`AdminAlbum`,
  `AdminVideo`, `AdminSettings`, `AdminPhoto`) and `mock-store.tsx` are retired.
- Next.js 16 Route Handler `params` are a `Promise` — always `await params` (same
  constraint as the previous plan).

---

## Task 1: Backend corrections and additions

**Files:**
- Modify: `supabase/schema.sql`, `lib/supabase/types.ts`, `lib/data/settings.ts`,
  `lib/api/schemas.ts`, `app/api/uploads/presign/route.ts`, `lib/r2.ts`, `lib/r2.test.ts`,
  `lib/data/albums.ts`, `app/api/albums/[id]/route.ts`,
  `app/api/albums/[id]/photos/[photoId]/route.ts`, `.env.example`, `.env.local`
- Create: `lib/r2-url.ts`, `lib/r2-url.test.ts`

**Interfaces:**
- Produces: `publicImageUrl(key: string): string` (`lib/r2-url.ts`, no `"server-only"` —
  safe to import from client components);
  `getAlbumByIdAdmin(id: string): Promise<AlbumWithPhotos | null>` and
  `updatePhotoSortOrder(photoId: string, sortOrder: number): Promise<AlbumPhotoRow>`
  (`lib/data/albums.ts`); `GET /api/albums/[id]` → `AlbumWithPhotos | 404`;
  `PATCH /api/albums/[id]/photos/[photoId]` → `AlbumPhotoRow`.

- [ ] **Step 1: Console — rename the `hero_video_key` column**

Supabase dashboard → your `remys-wedding` project → **SQL Editor** → **New query** →
run:

```sql
alter table site_settings rename column hero_video_key to hero_video_url;
```

Expected: "Success. No rows returned." Verify in **Table Editor** → `site_settings` that
the column is now named `hero_video_url`.

- [ ] **Step 2: Update `supabase/schema.sql`**

Find this block:
```sql
  hero_background_mode text not null default 'video'
    check (hero_background_mode in ('video', 'images')),
  hero_video_key text,
```
Replace with:
```sql
  hero_background_mode text not null default 'video'
    check (hero_background_mode in ('video', 'images')),
  hero_video_url text,
```

- [ ] **Step 3: Update `lib/supabase/types.ts`**

In `SiteSettingsRow`, rename the field:
```ts
  hero_video_key: string | null
```
to:
```ts
  hero_video_url: string | null
```

- [ ] **Step 4: Update `lib/data/settings.ts`**

In `updateSiteSettings`'s patch type, replace `"hero_video_key"` with
`"hero_video_url"` in the `Pick<...>` field list.

- [ ] **Step 5: Update `lib/api/schemas.ts`**

In `updateSettingsSchema`, replace:
```ts
  hero_video_key: z.string().nullable().optional(),
```
with:
```ts
  hero_video_url: z.string().nullable().optional(),
```

In `presignRequestSchema`, delete the entire `hero-video` variant from the
`z.discriminatedUnion`, leaving only `album-photo` and `hero-image`:
```ts
export const presignRequestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("album-photo"),
    fileName: z.string().min(1),
    contentType: z.string().startsWith("image/"),
    albumSlug: z.string().min(1),
  }),
  z.object({
    kind: z.literal("hero-image"),
    fileName: z.string().min(1),
    contentType: z.string().startsWith("image/"),
  }),
])
```

- [ ] **Step 6: Update `app/api/uploads/presign/route.ts`**

Replace the whole file (drops the `buildHeroKey`/`hero-video` branch):

```ts
import { NextResponse } from "next/server"

import { presignRequestSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { buildHeroImageKey, buildPhotoKey, presignUpload } from "@/lib/r2"

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, presignRequestSchema)
  if ("error" in parsed) return parsed.error
  const body = parsed.data

  const key =
    body.kind === "album-photo"
      ? buildPhotoKey(body.albumSlug, body.fileName)
      : buildHeroImageKey(body.fileName)

  const uploadUrl = await presignUpload(key, body.contentType)
  return NextResponse.json({ uploadUrl, key })
}
```

- [ ] **Step 7: Remove `buildHeroKey` from `lib/r2.ts` and its test**

In `lib/r2.ts`, delete the `buildHeroKey` function (now unused — hero video is a plain
URL, not an R2 object).

In `lib/r2.test.ts`, delete the `describe("buildHeroKey", ...)` block and remove
`buildHeroKey` from the import line, leaving:
```ts
import { buildHeroImageKey, buildPhotoKey, imageUrl } from "./r2"
```

- [ ] **Step 8: Run tests to confirm the removal didn't break anything**

Run: `pnpm test`
Expected: PASS — 4 tests (down from 5; `buildHeroKey`'s test is gone).

- [ ] **Step 9: Write the failing test for `publicImageUrl`**

Create `lib/r2-url.test.ts`:

```ts
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
```

- [ ] **Step 10: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `lib/r2-url.ts` doesn't exist yet.

- [ ] **Step 11: Write `lib/r2-url.ts`**

```ts
export function publicImageUrl(key: string): string {
  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}/${key}`
}
```

No `"server-only"` here on purpose — this file is imported from client components to
render `<img src>`/`<video src>` for keys that came back from the API.

- [ ] **Step 12: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS — 5 tests total.

- [ ] **Step 13: Add the public env var**

In `.env.example`, add a line right after `R2_PUBLIC_BASE_URL=`:
```
NEXT_PUBLIC_R2_PUBLIC_BASE_URL=
```

In `.env.local`, add the same key set to the **same value** as your existing
`R2_PUBLIC_BASE_URL` (e.g. `NEXT_PUBLIC_R2_PUBLIC_BASE_URL=https://pub-<hash>.r2.dev`).
Next.js only inlines env vars prefixed `NEXT_PUBLIC_` into the client bundle — the
existing `R2_PUBLIC_BASE_URL` (no prefix) stays server-only for `lib/r2.ts`'s
`imageUrl()`, which is unrelated to this new client-safe helper.

- [ ] **Step 14: Add `getAlbumByIdAdmin` to `lib/data/albums.ts`**

Add this function (uses the admin client, no `is_published` filter — unlike the public
`getPublishedAlbumBySlug`, drafts must be visible to the admin who owns them):

```ts
export async function getAlbumByIdAdmin(id: string): Promise<AlbumWithPhotos | null> {
  const supabase = createAdminClient()

  const { data: album, error } = await supabase
    .from("albums")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  if (!album) return null

  const { data: photos, error: photosError } = await supabase
    .from("album_photos")
    .select("*")
    .eq("album_id", album.id)
    .order("sort_order", { ascending: true })
  if (photosError) throw photosError

  return { ...album, photos: photos ?? [] }
}
```

- [ ] **Step 15: Add `updatePhotoSortOrder` to `lib/data/albums.ts`**

```ts
export async function updatePhotoSortOrder(
  photoId: string,
  sortOrder: number
): Promise<AlbumPhotoRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("album_photos")
    .update({ sort_order: sortOrder })
    .eq("id", photoId)
    .select("*")
    .single()
  if (error) throw error
  return data
}
```

- [ ] **Step 16: Add the `GET` handler to `app/api/albums/[id]/route.ts`**

Add this export alongside the existing `PATCH`/`DELETE` in the same file (add
`getAlbumByIdAdmin` to the existing `@/lib/data/albums` import):

```ts
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const album = await getAlbumByIdAdmin(id)
  if (!album) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(album)
}
```

- [ ] **Step 17: Add the `PATCH` handler to `app/api/albums/[id]/photos/[photoId]/route.ts`**

Add this export alongside the existing `DELETE` in the same file:

```ts
import { updateHeroImageSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { updatePhotoSortOrder } from "@/lib/data/albums"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params
  const parsed = await parseJsonBody(request, updateHeroImageSchema)
  if ("error" in parsed) return parsed.error
  const photo = await updatePhotoSortOrder(photoId, parsed.data.sortOrder)
  return NextResponse.json(photo)
}
```

(Reuses `updateHeroImageSchema` — `{ sortOrder: number }` — since the shape is
identical; no need for a near-duplicate schema.)

- [ ] **Step 18: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass.

- [ ] **Step 19: Manual verify — new/changed routes with a real session cookie**

`pnpm dev`, log in at `/admin/login`, copy the `sb-...-auth-token` cookie value (same
process as the previous plan). Then:

```bash
COOKIE='sb-btxeflwgszliholnnfqy-auth-token=PASTE_VALUE_HERE'

curl -s http://localhost:3000/api/settings -H "Cookie: $COOKIE"
# Expected: JSON includes "hero_video_url" (not "hero_video_key")

curl -s -X POST http://localhost:3000/api/albums \
  -H "Cookie: $COOKIE" -H "Content-Type: application/json" \
  -d '{"category":"wedding","title":"Task1 Verify","slug":"task1-verify"}'
# Copy the returned "id"

curl -s http://localhost:3000/api/albums/<id-from-above> -H "Cookie: $COOKIE"
# Expected: the album JSON, now with a "photos": [] array included

curl -s -X DELETE http://localhost:3000/api/albums/<id-from-above> -H "Cookie: $COOKIE"
```

Stop the dev server after.

- [ ] **Step 20: Commit**

```bash
git add supabase/schema.sql lib/supabase/types.ts lib/data/settings.ts \
  lib/api/schemas.ts app/api/uploads/presign/route.ts lib/r2.ts lib/r2.test.ts \
  lib/data/albums.ts app/api/albums/\[id\]/route.ts \
  app/api/albums/\[id\]/photos/\[photoId\]/route.ts .env.example \
  lib/r2-url.ts lib/r2-url.test.ts
git commit -m "fix: rename hero_video_key to hero_video_url, add album-by-id and photo-sort-order routes"
```

(`.env.local` is gitignored — nothing to add there.)

---

## Task 2: React Query infrastructure

**Files:**
- Create: `lib/queries/http.ts`, `lib/queries/keys.ts`, `components/providers/query-provider.tsx`
- Modify: `app/admin/layout.tsx`

**Interfaces:**
- Produces: `http` (axios instance, `lib/queries/http.ts`); `queryKeys` object
  (`lib/queries/keys.ts`) with `albums`, `album(id)`, `videos`, `heroImages`, `settings`
  key factories; `QueryProvider` component (wraps children in `QueryClientProvider` +
  devtools).

- [ ] **Step 1: Write `lib/queries/http.ts`**

```ts
import axios from "axios"

export const http = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
})
```

- [ ] **Step 2: Write `lib/queries/keys.ts`**

```ts
export const queryKeys = {
  albums: ["albums"] as const,
  album: (id: string) => ["albums", id] as const,
  videos: ["videos"] as const,
  heroImages: ["hero-images"] as const,
  settings: ["settings"] as const,
}
```

- [ ] **Step 3: Write `components/providers/query-provider.tsx`**

```tsx
"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

- [ ] **Step 4: Install the devtools package**

```bash
pnpm add @tanstack/react-query-devtools
```

- [ ] **Step 5: Wrap the admin layout with `QueryProvider`, alongside the existing provider**

`AdminDataProvider` stays for now — screens are migrated one at a time in later tasks,
and un-migrated screens still need it. Only `QueryProvider` is new here:

```tsx
import { AdminDataProvider } from "@/lib/admin/mock-store"
import { QueryProvider } from "@/components/providers/query-provider"

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <QueryProvider>
      <AdminDataProvider>{children}</AdminDataProvider>
    </QueryProvider>
  )
}
```

- [ ] **Step 6: Typecheck, lint, and manual smoke test**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass.

Run `pnpm dev`, open `/admin` (logged in) — the page should render exactly as before
(nothing changed yet, this task only adds a second, currently-unused provider). Open the
React Query Devtools icon (bottom of the screen) and confirm it opens (empty query list
is expected — nothing uses react-query yet). Stop the dev server after.

- [ ] **Step 7: Commit**

```bash
git add lib/queries/http.ts lib/queries/keys.ts components/providers/query-provider.tsx \
  app/admin/layout.tsx package.json pnpm-lock.yaml
git commit -m "feat: add react-query infrastructure alongside the existing mock provider"
```

---

## Task 3: Albums + uploads query hooks

**Files:**
- Create: `lib/queries/uploads/index.ts`, `lib/queries/albums/index.ts`

**Interfaces:**
- Consumes: `queryKeys`, `http` (Task 2).
- Produces: `useUploadFile()` mutation hook returning `{ key, url }` given
  `{ file, kind, albumSlug? }` (`lib/queries/uploads/index.ts`); `useAlbums()`,
  `useAlbum(id)`, `useCreateAlbum()`, `useUpdateAlbum()`, `useDeleteAlbum()`,
  `useAddPhoto()`, `useDeletePhoto()`, `useUpdatePhotoSortOrder()`
  (`lib/queries/albums/index.ts`) — all consumed by Tasks 4-5.

- [ ] **Step 1: Write `lib/queries/uploads/index.ts`**

```ts
import { useMutation } from "@tanstack/react-query"

import { http } from "@/lib/queries/http"
import { publicImageUrl } from "@/lib/r2-url"

type UploadKind = "album-photo" | "hero-image"

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
```

(The R2 `PUT` uses plain `fetch`, not the `http` axios instance — `uploadUrl` points at
`*.r2.cloudflarestorage.com`, a different origin than `/api`, and needs no auth header.)

- [ ] **Step 2: Write `lib/queries/albums/index.ts`**

```ts
"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { http } from "@/lib/queries/http"
import { queryKeys } from "@/lib/queries/keys"
import type { AlbumCategory, AlbumPhotoRow, AlbumRow } from "@/lib/supabase/types"

type AlbumWithPhotos = AlbumRow & { photos: AlbumPhotoRow[] }

export function useAlbums() {
  return useQuery({
    queryKey: queryKeys.albums,
    queryFn: async () => (await http.get<AlbumRow[]>("/albums")).data,
  })
}

export function useAlbum(id: string) {
  return useQuery({
    queryKey: queryKeys.album(id),
    queryFn: async () => (await http.get<AlbumWithPhotos>(`/albums/${id}`)).data,
    enabled: Boolean(id),
  })
}

export function useCreateAlbum() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      category: AlbumCategory
      title: string
      slug: string
      eventDate?: string | null
    }) => (await http.post<AlbumRow>("/albums", input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.albums })
    },
  })
}

export function useUpdateAlbum(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      patch: Partial<
        Pick<
          AlbumRow,
          | "title"
          | "slug"
          | "event_date"
          | "location"
          | "cover_image_key"
          | "highlight_video_url"
          | "is_featured"
          | "is_published"
          | "sort_order"
        >
      >
    ) => (await http.patch<AlbumRow>(`/albums/${id}`, patch)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.albums })
      queryClient.invalidateQueries({ queryKey: queryKeys.album(id) })
    },
  })
}

export function useDeleteAlbum() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/albums/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.albums })
    },
  })
}

export function useAddPhoto(albumId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { imageKey: string; sortOrder: number }) =>
      (await http.post<AlbumPhotoRow>(`/albums/${albumId}/photos`, input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.album(albumId) })
    },
  })
}

export function useDeletePhoto(albumId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (photoId: string) => {
      await http.delete(`/albums/${albumId}/photos/${photoId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.album(albumId) })
    },
  })
}

export function useUpdatePhotoSortOrder(albumId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { photoId: string; sortOrder: number }) =>
      (
        await http.patch<AlbumPhotoRow>(
          `/albums/${albumId}/photos/${input.photoId}`,
          { sortOrder: input.sortOrder }
        )
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.album(albumId) })
    },
  })
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass (these hooks aren't used by any screen yet, but must compile clean).

- [ ] **Step 4: Commit**

```bash
git add lib/queries/uploads lib/queries/albums
git commit -m "feat: add albums and uploads react-query hooks"
```

---

## Task 4: Wire the albums list screen

**Files:**
- Modify: `screens/admin/albums-list/index.tsx`,
  `screens/admin/albums-list/components/album-table.tsx`,
  `screens/admin/albums-list/components/new-album-dialog.tsx`

**Interfaces:**
- Consumes: `useAlbums`, `useCreateAlbum`, `useUpdateAlbum`, `useDeleteAlbum` (Task 3).

- [ ] **Step 1: Rewrite `screens/admin/albums-list/index.tsx`**

Replace `useAdminData` with `useAlbums`, and handle the loading state (the mock version
had none — data was always synchronously ready):

```tsx
"use client"

import { useState } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CATEGORY_LABEL, type AlbumCategory } from "@/lib/mock-albums"
import { useAlbums } from "@/lib/queries/albums"
import { AlbumTable } from "@/screens/admin/albums-list/components/album-table"
import { NewAlbumDialog } from "@/screens/admin/albums-list/components/new-album-dialog"

const FILTERS: { value: AlbumCategory | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pre_wedding", label: CATEGORY_LABEL.pre_wedding },
  { value: "wedding", label: CATEGORY_LABEL.wedding },
]

export function AlbumsListScreen() {
  const { data: albums, isLoading } = useAlbums()
  const [filter, setFilter] = useState<AlbumCategory | "all">("all")

  const filtered =
    !albums ? [] : filter === "all" ? albums : albums.filter((a) => a.category === filter)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Albums</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {albums?.length ?? 0} album
          </p>
        </div>
        <NewAlbumDialog />
      </div>

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as AlbumCategory | "all")}
      >
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f.value} value={f.value}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Đang tải...</p>
      ) : (
        <AlbumTable albums={filtered} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `screens/admin/albums-list/components/album-table.tsx`**

Replace `useAdminData` with the real mutation hooks. `AlbumRow` (server shape) replaces
`AdminAlbum` (mock shape) — the field names differ (`cover_image_key`/`is_published`/
`is_featured` vs `coverImage`/`isPublished`/`isFeatured`), and images render via
`publicImageUrl()`:

```tsx
"use client"

import Link from "next/link"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { CATEGORY_LABEL } from "@/lib/mock-albums"
import { useDeleteAlbum, useUpdateAlbum } from "@/lib/queries/albums"
import { publicImageUrl } from "@/lib/r2-url"
import type { AlbumRow } from "@/lib/supabase/types"
import { formatDdMmYyyy } from "@/lib/utils"

function AlbumRowActions({ album }: { album: AlbumRow }) {
  const updateAlbum = useUpdateAlbum(album.id)
  const deleteAlbum = useDeleteAlbum()

  return (
    <>
      <TableCell>
        <Switch
          checked={album.is_published}
          disabled={updateAlbum.isPending}
          onCheckedChange={(checked) => {
            updateAlbum.mutate(
              { is_published: checked },
              {
                onSuccess: () =>
                  toast.success(checked ? "Đã đăng album" : "Đã ẩn album"),
                onError: () => toast.error("Không thể cập nhật album"),
              }
            )
          }}
        />
      </TableCell>
      <TableCell>
        <Switch
          checked={album.is_featured}
          disabled={updateAlbum.isPending}
          onCheckedChange={(checked) =>
            updateAlbum.mutate(
              { is_featured: checked },
              { onError: () => toast.error("Không thể cập nhật album") }
            )
          }
        />
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            nativeButton={false}
            render={<Link href={`/admin/albums/${album.id}`} />}
          >
            <Pencil />
            <span className="sr-only">Sửa</span>
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="icon-sm">
                <Trash2 />
                <span className="sr-only">Xoá</span>
              </Button>
            }
            title={`Xoá "${album.title}"?`}
            description="Album và toàn bộ ảnh sẽ bị xoá vĩnh viễn. Không thể hoàn tác."
            onConfirm={() => {
              deleteAlbum.mutate(album.id, {
                onSuccess: () => toast.success("Đã xoá album"),
                onError: () => toast.error("Không thể xoá album"),
              })
            }}
          />
        </div>
      </TableCell>
    </>
  )
}

export function AlbumTable({ albums }: { albums: AlbumRow[] }) {
  if (albums.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        Chưa có album nào trong danh mục này.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16"></TableHead>
            <TableHead>Album</TableHead>
            <TableHead>Danh mục</TableHead>
            <TableHead>Ngày</TableHead>
            <TableHead>Đã đăng</TableHead>
            <TableHead>Nổi bật</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {albums.map((album) => (
            <TableRow key={album.id}>
              <TableCell>
                <div className="relative size-11 overflow-hidden rounded-md bg-muted">
                  {album.cover_image_key && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={publicImageUrl(album.cover_image_key)}
                      alt=""
                      className="size-full object-cover"
                    />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Link
                  href={`/admin/albums/${album.id}`}
                  className="font-medium text-foreground hover:text-clay"
                >
                  {album.title || "(Chưa đặt tên)"}
                </Link>
                <p className="text-xs text-muted-foreground">/{album.slug}</p>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{CATEGORY_LABEL[album.category]}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {album.event_date ? formatDdMmYyyy(album.event_date) : "—"}
              </TableCell>
              <AlbumRowActions album={album} />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 3: Rewrite `screens/admin/albums-list/components/new-album-dialog.tsx`**

`createAlbum` is now async — the dialog closes and navigates in `onSuccess`, not right
after calling it:

```tsx
"use client"

import { useState, type FormEvent } from "react"
import { CalendarIcon, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CATEGORY_LABEL, type AlbumCategory } from "@/lib/mock-albums"
import { useCreateAlbum } from "@/lib/queries/albums"
import { composeSlug, toIsoDate } from "@/lib/utils"

export function NewAlbumDialog() {
  const router = useRouter()
  const createAlbum = useCreateAlbum()

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState<AlbumCategory>("wedding")
  const [eventDate, setEventDate] = useState<Date | undefined>()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !eventDate) return

    const isoDate = toIsoDate(eventDate)
    createAlbum.mutate(
      {
        title: title.trim(),
        category,
        slug: composeSlug(title, isoDate),
        eventDate: isoDate,
      },
      {
        onSuccess: (album) => {
          toast.success("Đã tạo album nháp")
          setOpen(false)
          setTitle("")
          setEventDate(undefined)
          router.push(`/admin/albums/${album.id}`)
        },
        onError: () => toast.error("Không thể tạo album"),
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Album mới
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tạo album mới</DialogTitle>
            <DialogDescription>
              Tạo bản nháp, bạn có thể thêm ảnh và chi tiết ở bước tiếp theo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-album-title">Tên album</Label>
              <Input
                id="new-album-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Linh & Minh"
                autoFocus
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-album-category">Danh mục</Label>
              <Select
                items={CATEGORY_LABEL}
                value={category}
                onValueChange={(value) => setCategory(value as AlbumCategory)}
              >
                <SelectTrigger id="new-album-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABEL) as AlbumCategory[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {CATEGORY_LABEL[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-album-date">Ngày cưới</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      id="new-album-date"
                      type="button"
                      variant="outline"
                      className="w-full justify-start font-normal"
                    />
                  }
                >
                  <CalendarIcon className="size-4" />
                  {eventDate ? eventDate.toLocaleDateString("vi-VN") : "Chọn ngày"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={eventDate}
                    onSelect={setEventDate}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={!title.trim() || !eventDate || createAlbum.isPending}
            >
              Tạo album
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass.

- [ ] **Step 5: Manual verify**

`pnpm dev`, log in, go to `/admin/albums`. Confirm: list loads real data (may be empty
if you've been cleaning up test albums — that's fine, "Chưa có album nào" should show).
Create a new album via the dialog — confirm it navigates to the detail page (which still
runs on mock data until Task 5; a "Không tìm thấy album này" message there is expected
for now). Go back to `/admin/albums`, confirm the new album appears, toggle its
published/featured switches, confirm toasts appear and the switches persist across a
page refresh (proof it's really in the DB). Delete it. Stop the dev server after.

- [ ] **Step 6: Commit**

```bash
git add screens/admin/albums-list
git commit -m "feat: wire albums list screen to real API via react-query"
```

---

## Task 5: Wire the album detail screen

**Files:**
- Modify: `screens/admin/album-detail/index.tsx`, `components/admin/media-upload-field.tsx`,
  `lib/admin/schemas.ts`

**Interfaces:**
- Consumes: `useAlbum`, `useUpdateAlbum`, `useDeleteAlbum`, `useAddPhoto`,
  `useDeletePhoto`, `useUpdatePhotoSortOrder` (Task 3), `useUploadFile` (Task 3).

- [ ] **Step 1: Drop the `photos` field from `albumSchema`**

Photos are no longer part of what "Lưu thay đổi" submits (Step 2 below) — they save
instantly through their own mutations. Validating them against the old
`{ id, url }`-shaped mock `photos` array no longer makes sense (the real
`AlbumPhotoRow` shape is `{ id, album_id, image_key, sort_order, created_at }`, with no
`url` field), so `albumSchema` would otherwise reject every album that has photos. In
`lib/admin/schemas.ts`, remove the `photos` field from `albumSchema`:

```ts
export const albumSchema = z.object({
  title: z.string().trim().min(1, "Vui lòng nhập tên album"),
  slug: z.string().trim().min(1, "Vui lòng nhập slug"),
  category: z.enum(["pre_wedding", "wedding"]),
  location: z.string().trim().min(1, "Vui lòng nhập địa điểm"),
  eventDate: z.string().trim().min(1, "Vui lòng chọn ngày cưới"),
  highlightVideoUrl: z.string(),
  coverImage: z.string().trim().min(1, "Vui lòng chọn ảnh bìa"),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
})
```

- [ ] **Step 2: Change `MediaUploadField`'s file-selection callback**

The mock version computed `URL.createObjectURL(file)` internally and called
`onChange(url)`. Real uploads take time and can fail, so the component now just hands
the raw `File` to its caller — same pattern `PhotoManager` already uses for `onAdd`:

```tsx
"use client"

import { useRef } from "react"
import { ImageUp, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function MediaUploadField({
  id,
  label,
  value,
  onFileSelected,
  onClear,
  uploading,
  kind,
}: {
  id: string
  label: string
  value: string
  onFileSelected: (file: File) => void
  onClear: () => void
  uploading?: boolean
  kind: "image" | "video"
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onFileSelected(file)
    e.target.value = ""
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>

      <div className="flex items-center gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {value ? (
            kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="size-full object-cover" />
            ) : (
              <video src={value} className="size-full object-cover" muted />
            )
          ) : (
            <ImageUp className="size-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Đang tải..." : value ? "Đổi file" : "Tải lên"}
          </Button>
          {value && !uploading && (
            <Button type="button" variant="ghost" size="icon-sm" onClick={onClear}>
              <X />
              <span className="sr-only">Xoá</span>
            </Button>
          )}
        </div>

        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={kind === "image" ? "image/*" : "video/*"}
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Rewrite `screens/admin/album-detail/index.tsx`**

This is the largest change in the plan. Key differences from the mock version:
- `getAlbum`/`updateAlbum`/`deleteAlbum` come from the new hooks, not `useAdminData()`.
- `form` now only holds the **scalar** fields (no `photos` array) — photos render
  straight from `useAlbum(albumId)`'s query data and mutate instantly.
- Cover image upload calls `useUploadFile()`, then stores the returned `key` in
  `form.coverImageKey` (submitted as `cover_image_key` on save) while
  `publicImageUrl(key)` feeds the preview.
- Photo add/remove/reorder call their mutations directly — no local state, no dirty
  check, no "Lưu thay đổi" involvement.

```tsx
"use client"

import { useEffect, useState } from "react"
import {
  ArrowLeft,
  CalendarIcon,
  GalleryHorizontal,
  Info,
  SlidersHorizontal,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { MediaUploadField } from "@/components/admin/media-upload-field"
import { PhotoManager } from "@/components/admin/photo-manager"
import { SectionCard } from "@/components/admin/section-card"
import { CATEGORY_LABEL, type AlbumCategory } from "@/lib/mock-albums"
import {
  useAddPhoto,
  useAlbum,
  useDeleteAlbum,
  useDeletePhoto,
  useUpdateAlbum,
  useUpdatePhotoSortOrder,
  useUploadFile,
} from "@/lib/queries/albums"
import { albumSchema, fieldErrors, type AlbumFormErrors } from "@/lib/admin/schemas"
import { publicImageUrl } from "@/lib/r2-url"
import { composeSlug, parseIsoDate, toIsoDate } from "@/lib/utils"

type ScalarForm = {
  title: string
  slug: string
  category: AlbumCategory
  location: string
  eventDate: string
  highlightVideoUrl: string
  coverImageKey: string
}

export function AlbumDetailScreen({ albumId }: { albumId: string }) {
  const router = useRouter()
  const { data: album, isLoading } = useAlbum(albumId)
  const updateAlbum = useUpdateAlbum(albumId)
  const deleteAlbum = useDeleteAlbum()
  const addPhoto = useAddPhoto(albumId)
  const deletePhoto = useDeletePhoto(albumId)
  const updatePhotoSortOrder = useUpdatePhotoSortOrder(albumId)
  const uploadFile = useUploadFile()

  const [form, setForm] = useState<ScalarForm | null>(null)
  const [savedForm, setSavedForm] = useState<ScalarForm | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState<AlbumFormErrors>({})

  useEffect(() => {
    if (!album) return
    const values: ScalarForm = {
      title: album.title,
      slug: album.slug,
      category: album.category,
      location: album.location ?? "",
      eventDate: album.event_date ?? "",
      highlightVideoUrl: album.highlight_video_url ?? "",
      coverImageKey: album.cover_image_key ?? "",
    }
    setForm(values)
    setSavedForm(values)
  }, [album])

  if (isLoading) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Đang tải...</p>
  }

  if (!album || !form) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">Không tìm thấy album này.</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/admin/albums" />}>
          Quay lại danh sách
        </Button>
      </div>
    )
  }

  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm)

  function handleSave() {
    if (!form) return

    const result = albumSchema.safeParse({
      title: form.title,
      slug: form.slug,
      category: form.category,
      location: form.location,
      eventDate: form.eventDate,
      highlightVideoUrl: form.highlightVideoUrl,
      coverImage: form.coverImageKey,
      isFeatured: album.is_featured,
      isPublished: album.is_published,
    })
    if (!result.success) {
      setErrors(fieldErrors(result.error.issues))
      toast.error("Vui lòng kiểm tra lại thông tin trước khi lưu")
      return
    }

    setErrors({})
    updateAlbum.mutate(
      {
        title: form.title,
        slug: form.slug,
        location: form.location,
        event_date: form.eventDate || null,
        highlight_video_url: form.highlightVideoUrl || null,
        cover_image_key: form.coverImageKey || null,
      },
      {
        onSuccess: () => {
          setSavedForm(form)
          toast.success("Đã lưu thay đổi")
        },
        onError: () => toast.error("Không thể lưu thay đổi"),
      }
    )
  }

  const displayPhotos = album.photos.map((p) => ({
    id: p.id,
    url: publicImageUrl(p.image_key),
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/albums"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Albums
          </Link>
          <span className="text-border">/</span>
          <span className="text-sm font-medium text-foreground">
            {album.title || "(Chưa đặt tên)"}
          </span>
          <Badge variant={album.is_published ? "default" : "outline"}>
            {album.is_published ? "Đã đăng" : "Bản nháp"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {isDirty && (
            <Button onClick={handleSave} disabled={updateAlbum.isPending}>
              Lưu thay đổi
            </Button>
          )}
          <ConfirmDialog
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 className="size-4" />
                Xoá album
              </Button>
            }
            title={`Xoá "${album.title}"?`}
            description="Album và toàn bộ ảnh sẽ bị xoá vĩnh viễn. Không thể hoàn tác."
            onConfirm={() => {
              deleteAlbum.mutate(albumId, {
                onSuccess: () => {
                  toast.success("Đã xoá album")
                  router.push("/admin/albums")
                },
                onError: () => toast.error("Không thể xoá album"),
              })
            }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <SectionCard
          icon={Info}
          title="Thông tin album"
          description="Tên, danh mục và ảnh bìa"
          className="flex flex-col"
        >
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="title">Tên album</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value
                    setForm({
                      ...form,
                      title,
                      slug: slugTouched ? form.slug : composeSlug(title, form.eventDate),
                    })
                  }}
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setForm({ ...form, slug: e.target.value })
                  }}
                  aria-invalid={Boolean(errors.slug)}
                />
                {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category">Danh mục</Label>
                <Select
                  items={CATEGORY_LABEL}
                  value={form.category}
                  onValueChange={(value) =>
                    setForm({ ...form, category: value as AlbumCategory })
                  }
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_LABEL) as AlbumCategory[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {CATEGORY_LABEL[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="location">Địa điểm</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  aria-invalid={Boolean(errors.location)}
                />
                {errors.location && (
                  <p className="text-xs text-destructive">{errors.location}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="eventDate">Ngày cưới</Label>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        id="eventDate"
                        type="button"
                        variant="outline"
                        className="w-full justify-start font-normal"
                        aria-invalid={Boolean(errors.eventDate)}
                      />
                    }
                  >
                    <CalendarIcon className="size-4" />
                    {form.eventDate
                      ? parseIsoDate(form.eventDate)?.toLocaleDateString("vi-VN")
                      : "Chọn ngày"}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={parseIsoDate(form.eventDate)}
                      onSelect={(date) => {
                        if (!date) return
                        const eventDate = toIsoDate(date)
                        setForm({
                          ...form,
                          eventDate,
                          slug: slugTouched ? form.slug : composeSlug(form.title, eventDate),
                        })
                      }}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.eventDate && (
                  <p className="text-xs text-destructive">{errors.eventDate}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="highlightVideoUrl">
                  Video highlight (YouTube/Vimeo, không bắt buộc)
                </Label>
                <Input
                  id="highlightVideoUrl"
                  value={form.highlightVideoUrl}
                  onChange={(e) =>
                    setForm({ ...form, highlightVideoUrl: e.target.value })
                  }
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <MediaUploadField
                id="coverImage"
                label="Ảnh bìa"
                kind="image"
                value={form.coverImageKey ? publicImageUrl(form.coverImageKey) : ""}
                uploading={uploadFile.isPending}
                onFileSelected={(file) => {
                  uploadFile.mutate(
                    { file, kind: "album-photo", albumSlug: album.slug },
                    {
                      onSuccess: ({ key }) => setForm({ ...form, coverImageKey: key }),
                      onError: () => toast.error("Không thể tải ảnh lên"),
                    }
                  )
                }}
                onClear={() => setForm({ ...form, coverImageKey: "" })}
              />
              {errors.coverImage && (
                <p className="text-xs text-destructive">{errors.coverImage}</p>
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          icon={SlidersHorizontal}
          title="Trạng thái"
          description="Cập nhật ngay khi bật/tắt"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Đã đăng</p>
                <p className="text-xs text-muted-foreground">
                  Hiển thị công khai trên trang chủ
                </p>
              </div>
              <Switch
                checked={album.is_published}
                disabled={updateAlbum.isPending}
                onCheckedChange={(checked) =>
                  updateAlbum.mutate(
                    { is_published: checked },
                    { onError: () => toast.error("Không thể cập nhật") }
                  )
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Nổi bật</p>
                <p className="text-xs text-muted-foreground">
                  Xuất hiện ở mục album nổi bật
                </p>
              </div>
              <Switch
                checked={album.is_featured}
                disabled={updateAlbum.isPending}
                onCheckedChange={(checked) =>
                  updateAlbum.mutate(
                    { is_featured: checked },
                    { onError: () => toast.error("Không thể cập nhật") }
                  )
                }
              />
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        icon={GalleryHorizontal}
        title="Ảnh"
        description="Mỗi thay đổi ở đây lưu ngay, không cần bấm Lưu thay đổi"
      >
        <div className="flex flex-col gap-2">
          <PhotoManager
            photos={displayPhotos}
            onAdd={(files) => {
              files.forEach((file) => {
                uploadFile.mutate(
                  { file, kind: "album-photo", albumSlug: album.slug },
                  {
                    onSuccess: ({ key }) => {
                      addPhoto.mutate(
                        { imageKey: key, sortOrder: album.photos.length },
                        { onError: () => toast.error("Không thể lưu ảnh") }
                      )
                    },
                    onError: () => toast.error("Không thể tải ảnh lên"),
                  }
                )
              })
            }}
            onRemove={(photoId) => {
              deletePhoto.mutate(photoId, {
                onError: () => toast.error("Không thể xoá ảnh"),
              })
            }}
            onMove={(photoId, direction) => {
              const index = album.photos.findIndex((p) => p.id === photoId)
              if (index === -1) return
              const swapWith = direction === "up" ? index - 1 : index + 1
              if (swapWith < 0 || swapWith >= album.photos.length) return
              updatePhotoSortOrder.mutate({
                photoId: album.photos[index].id,
                sortOrder: album.photos[swapWith].sort_order,
              })
              updatePhotoSortOrder.mutate({
                photoId: album.photos[swapWith].id,
                sortOrder: album.photos[index].sort_order,
              })
            }}
          />
        </div>
      </SectionCard>
    </div>
  )
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass.

- [ ] **Step 5: Manual verify — the full album workflow with real uploads**

`pnpm dev`, log in, create a new album (or open an existing test one), and on its detail
page: upload a real cover image (confirm the preview updates once upload finishes,
confirm it does **not** persist until you click "Lưu thay đổi", confirm it does after);
add 2-3 real photos via "Thêm ảnh" (confirm each appears as soon as upload finishes —
no save button needed); remove one; reorder the remaining ones with the arrows; refresh
the page and confirm everything survived (proof it's server-backed, not local state).
Delete the test album when done. Stop the dev server after.

- [ ] **Step 6: Commit**

```bash
git add screens/admin/album-detail components/admin/media-upload-field.tsx \
  lib/admin/schemas.ts
git commit -m "feat: wire album detail screen to real API, photos save instantly"
```

---

## Task 6: Videos query hooks + screen wiring

**Files:**
- Create: `lib/queries/videos/index.ts`
- Modify: `screens/admin/videos-list/index.tsx`,
  `screens/admin/videos-list/components/video-table.tsx`,
  `screens/admin/videos-list/components/video-form-dialog.tsx`

**Interfaces:**
- Produces: `useVideos()`, `useCreateVideo()`, `useUpdateVideo()`, `useDeleteVideo()`
  (`lib/queries/videos/index.ts`).

- [ ] **Step 1: Write `lib/queries/videos/index.ts`**

```ts
"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { http } from "@/lib/queries/http"
import { queryKeys } from "@/lib/queries/keys"
import type { VideoRow } from "@/lib/supabase/types"

export function useVideos() {
  return useQuery({
    queryKey: queryKeys.videos,
    queryFn: async () => (await http.get<VideoRow[]>("/videos")).data,
  })
}

export function useCreateVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      title: string
      location: string
      eventDate: string
      youtubeUrl: string
    }) => (await http.post<VideoRow>("/videos", input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos })
    },
  })
}

export function useUpdateVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<{
        title: string
        location: string
        event_date: string
        youtube_url: string
        is_published: boolean
      }>
    }) => (await http.patch<VideoRow>(`/videos/${id}`, patch)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos })
    },
  })
}

export function useDeleteVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/videos/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.videos })
    },
  })
}
```

- [ ] **Step 2: Rewrite `screens/admin/videos-list/index.tsx`**

```tsx
"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useVideos } from "@/lib/queries/videos"
import { VideoFormDialog } from "@/screens/admin/videos-list/components/video-form-dialog"
import { VideoTable } from "@/screens/admin/videos-list/components/video-table"

export function VideosListScreen() {
  const { data: videos, isLoading } = useVideos()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-foreground">Videos</h1>
          <p className="mt-1 text-sm text-muted-foreground">{videos?.length ?? 0} video</p>
        </div>
        <VideoFormDialog
          trigger={
            <Button>
              <Plus className="size-4" />
              Video mới
            </Button>
          }
        />
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Đang tải...</p>
      ) : (
        <VideoTable videos={videos ?? []} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Rewrite `screens/admin/videos-list/components/video-table.tsx`**

```tsx
"use client"

import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { useDeleteVideo, useUpdateVideo } from "@/lib/queries/videos"
import type { VideoRow } from "@/lib/supabase/types"
import { videoThumbnail } from "@/lib/mock-videos"
import { formatDdMmYyyy } from "@/lib/utils"
import { VideoFormDialog } from "@/screens/admin/videos-list/components/video-form-dialog"

export function VideoTable({ videos }: { videos: VideoRow[] }) {
  const updateVideo = useUpdateVideo()
  const deleteVideo = useDeleteVideo()

  if (videos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
        Chưa có video nào.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16"></TableHead>
            <TableHead>Video</TableHead>
            <TableHead>Ngày quay</TableHead>
            <TableHead>Đã đăng</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((video) => (
            <TableRow key={video.id}>
              <TableCell>
                <div className="relative size-11 overflow-hidden rounded-md bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={videoThumbnail(video.youtube_url)}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
              </TableCell>
              <TableCell>
                <p className="font-medium text-foreground">
                  {video.title || "(Chưa đặt tên)"}
                </p>
                <p className="text-xs text-muted-foreground">{video.location || "—"}</p>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {video.event_date ? formatDdMmYyyy(video.event_date) : "—"}
              </TableCell>
              <TableCell>
                <Switch
                  checked={video.is_published}
                  disabled={updateVideo.isPending}
                  onCheckedChange={(checked) =>
                    updateVideo.mutate(
                      { id: video.id, patch: { is_published: checked } },
                      {
                        onSuccess: () =>
                          toast.success(checked ? "Đã đăng video" : "Đã ẩn video"),
                        onError: () => toast.error("Không thể cập nhật video"),
                      }
                    )
                  }
                />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <VideoFormDialog
                    video={video}
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Pencil />
                        <span className="sr-only">Sửa</span>
                      </Button>
                    }
                  />
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Trash2 />
                        <span className="sr-only">Xoá</span>
                      </Button>
                    }
                    title={`Xoá video "${video.title}"?`}
                    description="Video sẽ bị xoá khỏi trang. Không thể hoàn tác."
                    onConfirm={() => {
                      deleteVideo.mutate(video.id, {
                        onSuccess: () => toast.success("Đã xoá video"),
                        onError: () => toast.error("Không thể xoá video"),
                      })
                    }}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

- [ ] **Step 4: Rewrite `screens/admin/videos-list/components/video-form-dialog.tsx`**

```tsx
"use client"

import { useState, type FormEvent, type ReactElement } from "react"
import { CalendarIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fieldErrors, videoSchema, type VideoFormErrors } from "@/lib/admin/schemas"
import { useCreateVideo, useUpdateVideo } from "@/lib/queries/videos"
import type { VideoRow } from "@/lib/supabase/types"
import { parseIsoDate, toIsoDate } from "@/lib/utils"

type VideoFormValues = {
  title: string
  location: string
  eventDate: string
  youtubeUrl: string
}

const EMPTY_FORM: VideoFormValues = {
  title: "",
  location: "",
  eventDate: "",
  youtubeUrl: "",
}

function formFromVideo(video: VideoRow): VideoFormValues {
  return {
    title: video.title,
    location: video.location,
    eventDate: video.event_date,
    youtubeUrl: video.youtube_url,
  }
}

export function VideoFormDialog({
  video,
  trigger,
}: {
  video?: VideoRow
  trigger: ReactElement
}) {
  const createVideo = useCreateVideo()
  const updateVideo = useUpdateVideo()
  const isEdit = !!video

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<VideoFormValues>(
    video ? formFromVideo(video) : EMPTY_FORM
  )
  const [errors, setErrors] = useState<VideoFormErrors>({})

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setForm(video ? formFromVideo(video) : EMPTY_FORM)
      setErrors({})
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const result = videoSchema.safeParse(form)
    if (!result.success) {
      setErrors(fieldErrors(result.error.issues))
      return
    }

    if (video) {
      updateVideo.mutate(
        {
          id: video.id,
          patch: {
            title: result.data.title,
            location: result.data.location,
            event_date: result.data.eventDate,
            youtube_url: result.data.youtubeUrl,
          },
        },
        {
          onSuccess: () => {
            toast.success("Đã lưu video")
            setOpen(false)
          },
          onError: () => toast.error("Không thể lưu video"),
        }
      )
    } else {
      createVideo.mutate(
        {
          title: result.data.title,
          location: result.data.location,
          eventDate: result.data.eventDate,
          youtubeUrl: result.data.youtubeUrl,
        },
        {
          onSuccess: () => {
            toast.success("Đã thêm video")
            setOpen(false)
          },
          onError: () => toast.error("Không thể thêm video"),
        }
      )
    }
  }

  const isPending = createVideo.isPending || updateVideo.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Sửa video" : "Thêm video"}</DialogTitle>
            <DialogDescription>
              Chỉ cần tên cặp cưới, địa điểm, ngày quay và link YouTube.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video-title">Tên cặp cưới</Label>
              <Input
                id="video-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Linh & Minh"
                autoFocus
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video-location">Địa điểm</Label>
              <Input
                id="video-location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Phú Quốc"
              />
              {errors.location && (
                <p className="text-xs text-destructive">{errors.location}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video-date">Ngày quay</Label>
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      id="video-date"
                      type="button"
                      variant="outline"
                      className="w-full justify-start font-normal"
                    />
                  }
                >
                  <CalendarIcon className="size-4" />
                  {form.eventDate
                    ? parseIsoDate(form.eventDate)?.toLocaleDateString("vi-VN")
                    : "Chọn ngày"}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={parseIsoDate(form.eventDate)}
                    onSelect={(date) =>
                      date && setForm({ ...form, eventDate: toIsoDate(date) })
                    }
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.eventDate && (
                <p className="text-xs text-destructive">{errors.eventDate}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="video-url">Link YouTube</Label>
              <Input
                id="video-url"
                value={form.youtubeUrl}
                onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
              {errors.youtubeUrl && (
                <p className="text-xs text-destructive">{errors.youtubeUrl}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isEdit ? "Lưu thay đổi" : "Thêm video"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass.

- [ ] **Step 6: Manual verify**

`pnpm dev`, log in, go to `/admin/videos`. Create a video, confirm it appears, toggle
published, edit it, delete it. Refresh between steps to confirm persistence. Stop the
dev server after.

- [ ] **Step 7: Commit**

```bash
git add lib/queries/videos screens/admin/videos-list
git commit -m "feat: wire videos screen to real API via react-query"
```

---

## Task 7: Settings + hero images query hooks and screen wiring

**Files:**
- Create: `lib/queries/settings/index.ts`, `lib/queries/hero-images/index.ts`
- Modify: `screens/admin/settings/index.tsx`

**Interfaces:**
- Produces: `useSettings()`, `useUpdateSettings()` (`lib/queries/settings/index.ts`);
  `useHeroImages()`, `useAddHeroImage()`, `useDeleteHeroImage()`,
  `useUpdateHeroImageSortOrder()` (`lib/queries/hero-images/index.ts`).

- [ ] **Step 1: Write `lib/queries/settings/index.ts`**

```ts
"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { http } from "@/lib/queries/http"
import { queryKeys } from "@/lib/queries/keys"
import type { SiteSettingsRow } from "@/lib/supabase/types"

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: async () => (await http.get<SiteSettingsRow>("/settings")).data,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      patch: Partial<
        Pick<
          SiteSettingsRow,
          | "email"
          | "address"
          | "zalo_link"
          | "facebook_link"
          | "instagram_link"
          | "hero_background_mode"
          | "hero_video_url"
        >
      >
    ) => (await http.patch<SiteSettingsRow>("/settings", patch)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings })
    },
  })
}
```

- [ ] **Step 2: Write `lib/queries/hero-images/index.ts`**

```ts
"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { http } from "@/lib/queries/http"
import { queryKeys } from "@/lib/queries/keys"
import type { HeroImageRow } from "@/lib/supabase/types"

export function useHeroImages() {
  return useQuery({
    queryKey: queryKeys.heroImages,
    queryFn: async () => (await http.get<HeroImageRow[]>("/hero-images")).data,
  })
}

export function useAddHeroImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { imageKey: string; sortOrder: number }) =>
      (await http.post<HeroImageRow>("/hero-images", input)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.heroImages })
    },
  })
}

export function useDeleteHeroImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/hero-images/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.heroImages })
    },
  })
}

export function useUpdateHeroImageSortOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; sortOrder: number }) =>
      (
        await http.patch<HeroImageRow>(`/hero-images/${input.id}`, {
          sortOrder: input.sortOrder,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.heroImages })
    },
  })
}
```

- [ ] **Step 3: Rewrite `screens/admin/settings/index.tsx`**

Contact form and hero-mode/hero-video-URL form stay batched (one PATCH per "Lưu..."
button, same as before); hero images become instant, same pattern as album photos:

```tsx
"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Contact, Film } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AddressMapField } from "@/components/admin/address-map-field"
import { PhotoManager } from "@/components/admin/photo-manager"
import { SectionCard } from "@/components/admin/section-card"
import {
  useAddHeroImage,
  useDeleteHeroImage,
  useHeroImages,
  useUpdateHeroImageSortOrder,
} from "@/lib/queries/hero-images"
import { useSettings, useUpdateSettings } from "@/lib/queries/settings"
import { useUploadFile } from "@/lib/queries/uploads"
import { publicImageUrl } from "@/lib/r2-url"
import {
  contactSettingsSchema,
  fieldErrors,
  heroSettingsSchema,
  type ContactSettingsFormErrors,
  type HeroSettingsFormErrors,
} from "@/lib/admin/schemas"

type ContactForm = {
  email: string
  address: string
  zaloLink: string
  facebookLink: string
  instagramLink: string
}

type HeroForm = {
  heroBackgroundMode: "video" | "images"
  heroVideoUrl: string
}

export function SettingsScreen() {
  const { data: settings, isLoading } = useSettings()
  const updateSettings = useUpdateSettings()
  const { data: heroImages } = useHeroImages()
  const addHeroImage = useAddHeroImage()
  const deleteHeroImage = useDeleteHeroImage()
  const updateHeroImageSortOrder = useUpdateHeroImageSortOrder()
  const uploadFile = useUploadFile()

  const [contactForm, setContactForm] = useState<ContactForm | null>(null)
  const [contactErrors, setContactErrors] = useState<ContactSettingsFormErrors>({})

  const [heroForm, setHeroForm] = useState<HeroForm | null>(null)
  const [heroErrors, setHeroErrors] = useState<HeroSettingsFormErrors>({})

  useEffect(() => {
    if (!settings) return
    setContactForm({
      email: settings.email ?? "",
      address: settings.address ?? "",
      zaloLink: settings.zalo_link ?? "",
      facebookLink: settings.facebook_link ?? "",
      instagramLink: settings.instagram_link ?? "",
    })
    setHeroForm({
      heroBackgroundMode: settings.hero_background_mode,
      heroVideoUrl: settings.hero_video_url ?? "",
    })
  }, [settings])

  if (isLoading || !contactForm || !heroForm) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Đang tải...</p>
  }

  function handleSaveContact(e: FormEvent) {
    e.preventDefault()
    if (!contactForm) return
    const result = contactSettingsSchema.safeParse(contactForm)
    if (!result.success) {
      setContactErrors(fieldErrors(result.error.issues))
      return
    }
    setContactErrors({})
    updateSettings.mutate(
      {
        email: contactForm.email,
        address: contactForm.address,
        zalo_link: contactForm.zaloLink,
        facebook_link: contactForm.facebookLink,
        instagram_link: contactForm.instagramLink,
      },
      {
        onSuccess: () => toast.success("Đã lưu thông tin liên hệ"),
        onError: () => toast.error("Không thể lưu"),
      }
    )
  }

  function handleSaveHero(e: FormEvent) {
    e.preventDefault()
    if (!heroForm) return
    const result = heroSettingsSchema.safeParse(heroForm)
    if (!result.success) {
      setHeroErrors(fieldErrors(result.error.issues))
      return
    }
    setHeroErrors({})
    updateSettings.mutate(
      {
        hero_background_mode: heroForm.heroBackgroundMode,
        hero_video_url: heroForm.heroVideoUrl,
      },
      {
        onSuccess: () => toast.success("Đã lưu nền trang chủ"),
        onError: () => toast.error("Không thể lưu"),
      }
    )
  }

  const displayHeroImages = (heroImages ?? []).map((img) => ({
    id: img.id,
    url: publicImageUrl(img.image_key),
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Cài đặt</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thông tin liên hệ và nền trang chủ
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={handleSaveContact}>
          <SectionCard
            icon={Contact}
            title="Thông tin liên hệ"
            description="Hiển thị ở trang Liên hệ và chân trang"
            className="flex flex-col"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                  aria-invalid={Boolean(contactErrors.email)}
                />
                {contactErrors.email && (
                  <p className="text-xs text-destructive">{contactErrors.email}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input
                  id="address"
                  value={contactForm.address}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, address: e.target.value })
                  }
                  aria-invalid={Boolean(contactErrors.address)}
                />
                {contactErrors.address && (
                  <p className="text-xs text-destructive">{contactErrors.address}</p>
                )}
                <AddressMapField
                  address={contactForm.address}
                  onAddressChange={(value) =>
                    setContactForm({ ...contactForm, address: value })
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="zaloLink">Zalo</Label>
                <Input
                  id="zaloLink"
                  value={contactForm.zaloLink}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, zaloLink: e.target.value })
                  }
                  aria-invalid={Boolean(contactErrors.zaloLink)}
                />
                {contactErrors.zaloLink && (
                  <p className="text-xs text-destructive">{contactErrors.zaloLink}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="facebookLink">Facebook</Label>
                <Input
                  id="facebookLink"
                  value={contactForm.facebookLink}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, facebookLink: e.target.value })
                  }
                  aria-invalid={Boolean(contactErrors.facebookLink)}
                />
                {contactErrors.facebookLink && (
                  <p className="text-xs text-destructive">
                    {contactErrors.facebookLink}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="instagramLink">Instagram</Label>
                <Input
                  id="instagramLink"
                  value={contactForm.instagramLink}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, instagramLink: e.target.value })
                  }
                  aria-invalid={Boolean(contactErrors.instagramLink)}
                />
                {contactErrors.instagramLink && (
                  <p className="text-xs text-destructive">
                    {contactErrors.instagramLink}
                  </p>
                )}
              </div>

              <div className="flex justify-end border-t border-border pt-4">
                <Button type="submit" disabled={updateSettings.isPending}>
                  Lưu thông tin liên hệ
                </Button>
              </div>
            </div>
          </SectionCard>
        </form>

        <form onSubmit={handleSaveHero}>
          <SectionCard
            icon={Film}
            title="Nền trang chủ"
            description="Video hoặc ảnh slide hiển thị ở khu vực hero trang chủ"
            className="flex flex-col"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <div className="flex flex-col gap-0.5">
                  <Label htmlFor="heroBackgroundMode">Dùng ảnh slide</Label>
                  <p className="text-xs text-muted-foreground">
                    {heroForm.heroBackgroundMode === "images"
                      ? "Trang chủ đang hiển thị ảnh slide"
                      : "Trang chủ đang hiển thị video"}
                  </p>
                </div>
                <Switch
                  id="heroBackgroundMode"
                  checked={heroForm.heroBackgroundMode === "images"}
                  onCheckedChange={(checked) =>
                    setHeroForm({
                      ...heroForm,
                      heroBackgroundMode: checked ? "images" : "video",
                    })
                  }
                />
              </div>

              {heroForm.heroBackgroundMode === "video" ? (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="heroVideoUrl">Link video (YouTube/Vimeo)</Label>
                  <Input
                    id="heroVideoUrl"
                    value={heroForm.heroVideoUrl}
                    onChange={(e) =>
                      setHeroForm({ ...heroForm, heroVideoUrl: e.target.value })
                    }
                    placeholder="https://youtube.com/watch?v=..."
                    aria-invalid={Boolean(heroErrors.heroVideoUrl)}
                  />
                  {heroErrors.heroVideoUrl && (
                    <p className="text-xs text-destructive">
                      {heroErrors.heroVideoUrl}
                    </p>
                  )}
                </div>
              ) : (
                <PhotoManager
                  photos={displayHeroImages}
                  onAdd={(files) => {
                    files.forEach((file) => {
                      uploadFile.mutate(
                        { file, kind: "hero-image" },
                        {
                          onSuccess: ({ key }) => {
                            addHeroImage.mutate(
                              { imageKey: key, sortOrder: (heroImages ?? []).length },
                              { onError: () => toast.error("Không thể lưu ảnh") }
                            )
                          },
                          onError: () => toast.error("Không thể tải ảnh lên"),
                        }
                      )
                    })
                  }}
                  onRemove={(id) => {
                    deleteHeroImage.mutate(id, {
                      onError: () => toast.error("Không thể xoá ảnh"),
                    })
                  }}
                  onMove={(id, direction) => {
                    const images = heroImages ?? []
                    const index = images.findIndex((img) => img.id === id)
                    if (index === -1) return
                    const swapWith = direction === "up" ? index - 1 : index + 1
                    if (swapWith < 0 || swapWith >= images.length) return
                    updateHeroImageSortOrder.mutate({
                      id: images[index].id,
                      sortOrder: images[swapWith].sort_order,
                    })
                    updateHeroImageSortOrder.mutate({
                      id: images[swapWith].id,
                      sortOrder: images[index].sort_order,
                    })
                  }}
                />
              )}

              <div className="flex justify-end border-t border-border pt-4">
                <Button type="submit" disabled={updateSettings.isPending}>
                  Lưu nền trang chủ
                </Button>
              </div>
            </div>
          </SectionCard>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass.

- [ ] **Step 5: Manual verify**

`pnpm dev`, log in, go to `/admin/settings`. Edit contact fields, save, refresh, confirm
they persisted. Switch hero mode to "ảnh slide", upload 2 real images, confirm they
appear instantly (no save click needed), remove one, reorder, refresh to confirm.
Switch back to video mode, paste a YouTube URL, save, refresh, confirm it persisted.
Stop the dev server after.

- [ ] **Step 6: Commit**

```bash
git add lib/queries/settings lib/queries/hero-images screens/admin/settings
git commit -m "feat: wire settings screen to real API, hero images save instantly"
```

---

## Task 8: Wire the dashboard screen

**Files:**
- Modify: `screens/admin/dashboard/index.tsx`

**Interfaces:**
- Consumes: `useAlbums` (Task 3), `useVideos` (Task 6).

- [ ] **Step 1: Rewrite `screens/admin/dashboard/index.tsx`**

```tsx
"use client"

import { Film, Images, Sparkles } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { CATEGORY_LABEL } from "@/lib/mock-albums"
import { useAlbums } from "@/lib/queries/albums"
import { useVideos } from "@/lib/queries/videos"

const CATEGORY_ICON = {
  pre_wedding: Sparkles,
  wedding: Images,
} as const

export function DashboardScreen() {
  const { data: albums, isLoading: albumsLoading } = useAlbums()
  const { data: videos, isLoading: videosLoading } = useVideos()

  if (albumsLoading || videosLoading || !albums || !videos) {
    return <p className="py-20 text-center text-sm text-muted-foreground">Đang tải...</p>
  }

  const albumStats = (["pre_wedding", "wedding"] as const).map((category) => {
    const inCategory = albums.filter((a) => a.category === category)
    return {
      key: category,
      label: CATEGORY_LABEL[category],
      icon: CATEGORY_ICON[category],
      total: inCategory.length,
      published: inCategory.filter((a) => a.is_published).length,
    }
  })

  const stats = [
    ...albumStats,
    {
      key: "video",
      label: "Video cưới",
      icon: Film,
      total: videos.length,
      published: videos.filter((v) => v.is_published).length,
    },
  ]

  const publishedCount = albums.filter((a) => a.is_published).length
  const draftCount = albums.length - publishedCount

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Tổng quan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {albums.length} album · {videos.length} video · {publishedCount} đã đăng ·{" "}
          {draftCount} bản nháp
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          const draft = stat.total - stat.published
          return (
            <div
              key={stat.key}
              className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground/70">
                  <Icon className="size-4" />
                </div>
              </div>
              <p className="mt-3 font-serif text-3xl text-foreground">{stat.total}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.published} đã đăng
                {draft > 0 && ` · ${draft} bản nháp`}
              </p>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button nativeButton={false} render={<Link href="/admin/albums" />}>
          Quản lý albums
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/admin/videos" />}
        >
          Quản lý videos
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/admin/settings" />}
        >
          Cài đặt trang
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass.

- [ ] **Step 3: Manual verify**

`pnpm dev`, log in, open `/admin` — confirm the stat counts match what's actually in the
DB (cross-check against `/admin/albums` and `/admin/videos`). Stop the dev server after.

- [ ] **Step 4: Commit**

```bash
git add screens/admin/dashboard
git commit -m "feat: wire dashboard screen to real API via react-query"
```

---

## Task 9: Remove the mock data layer

**Files:**
- Delete: `lib/admin/mock-store.tsx`
- Modify: `app/admin/layout.tsx`

**Interfaces:** None — this task only removes now-dead code.

- [ ] **Step 1: Confirm nothing still imports `mock-store`**

Run: `grep -rn "lib/admin/mock-store" --include="*.tsx" --include="*.ts" .`
Expected: no matches outside `lib/admin/mock-store.tsx` itself and
`app/admin/layout.tsx` (which Step 2 fixes next).

If anything else matches, stop — a screen was missed in Tasks 4-8. Go back and wire it
before continuing.

- [ ] **Step 2: Simplify `app/admin/layout.tsx`**

```tsx
import { QueryProvider } from "@/components/providers/query-provider"

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <QueryProvider>{children}</QueryProvider>
}
```

- [ ] **Step 3: Delete `lib/admin/mock-store.tsx`**

```bash
rm lib/admin/mock-store.tsx
```

- [ ] **Step 4: Check for now-unused mock-shaped types**

Run: `grep -rn "AdminAlbum\|AdminVideo\|AdminSettings\b" --include="*.tsx" --include="*.ts" lib/ screens/ components/ app/`

`AdminPhoto`, `AlbumFormValues`, `VideoFormValues`, `ContactSettingsValues`,
`HeroSettingsValues`, `NewAlbumInput`, `HeroBackgroundMode` (all in
`lib/admin/types.ts`) are expected to still show usages — they're form-shape types, kept
per this plan's Global Constraints. If `AdminAlbum`, `AdminVideo`, or `AdminSettings`
(the full mock **row** types) show zero remaining usages, delete just those three type
definitions from `lib/admin/types.ts`, keeping the rest of the file.

- [ ] **Step 5: Full verification suite**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all three pass with zero errors.

- [ ] **Step 6: Full manual walkthrough**

`pnpm dev`, log in, and in one pass: check the dashboard stats, create an album with a
real cover image and 2 real photos, publish it, create a video, edit the settings
contact info and hero mode, log out, log back in. Everything should work exactly as it
did in the mock version, except every change now survives a full page refresh and a
server restart. Stop the dev server after.

- [ ] **Step 7: Commit**

```bash
git add app/admin/layout.tsx lib/admin/mock-store.tsx lib/admin/types.ts
git commit -m "chore: remove mock admin data layer, now fully wired to real API"
```
