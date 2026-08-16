# Data & Storage Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the backend foundation — Supabase Postgres schema + typed clients,
admin-route session gating, and a Cloudflare R2 client with upload/delete/URL helpers —
as working, independently verifiable infrastructure with no UI yet.

**Architecture:** Two Supabase clients (anonymous, for public reads under RLS; service-role
admin, for privileged writes that bypass RLS) plus one R2 (S3-compatible) client wrapped
in typed helper functions. A `proxy.ts` at the repo root gates `/admin/*` on a Supabase
session. A `lib/data/*` layer exposes typed CRUD functions that Plans 2 (admin panel) and
3 (public site wiring) will call directly — no route handlers exist yet, that's Plan 2.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict mode, `@supabase/supabase-js`,
`@supabase/ssr`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, Vitest (new — no
test runner exists in the repo yet), `tsx` + `dotenv` for a standalone verification script.

**Spec:** `docs/superpowers/specs/2026-08-16-backend-supabase-r2-design.md` (sections 2-9
apply directly to this plan; sections 5, 6, 8 (upload/delete flow via API routes, admin
UI) belong to Plan 2, not this one).

## Global Constraints

- Every file that touches a secret (service-role key, R2 secret key) must start with
  `import "server-only"` so a client-bundle import fails the build loudly.
- No table gets client-writable RLS policies — all writes go through the service-role
  admin client (spec section 2, section 9's `SUPABASE_SERVICE_ROLE_KEY` is server-only).
- R2 object keys, not full URLs, are what's stored/passed around (spec section 3) —
  `imageUrl(key)` is the only place a full URL gets constructed.
- One R2 bucket (`remys-media`) with `album-photos/` and `site-assets/` prefixes (spec
  section 4) — do not create a second bucket.
- Next.js 16 renamed `middleware.ts` to `proxy.ts` and the exported function to `proxy`
  (confirmed against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
  in this repo) — do not create a `middleware.ts` file.
- `lib/data/*` functions are the only code that queries Supabase directly outside the
  client files themselves — Plan 2/3 route handlers and Server Components call these,
  they don't build their own queries.

---

## Task 1: Repo scaffolding — dependencies, env template, test runner

**Files:**
- Modify: `package.json`
- Create: `.env.example`
- Modify: `.gitignore`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: `npm run test` (vitest), `npm run verify:foundation` (tsx script, added now
  but the target script itself is created in Task 6) scripts available for later tasks.

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr @aws-sdk/client-s3 @aws-sdk/s3-request-presigner server-only
```

- [ ] **Step 2: Install dev dependencies**

```bash
npm install -D vitest tsx dotenv
```

- [ ] **Step 3: Add `.env.example`**

```bash
# Supabase (see docs/superpowers/plans/2026-08-16-data-storage-foundation.md Task 3)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudflare R2 (see docs/superpowers/plans/2026-08-16-data-storage-foundation.md Task 2)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=remys-media
R2_PUBLIC_BASE_URL=
```

Write this content to `.env.example` at the repo root.

- [ ] **Step 4: Allow `.env.example` past the `.env*` gitignore rule**

Open `.gitignore`, find the line:
```
# env files (can opt-in for committing if needed)
.env*
```
Add a line directly after it:
```
!.env.example
```

- [ ] **Step 5: Add `vitest.config.ts`**

```ts
import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
```

- [ ] **Step 6: Add `test` and `verify:foundation` npm scripts**

In `package.json`, inside `"scripts"`, add:
```json
"test": "vitest run",
"verify:foundation": "tsx scripts/verify-foundation.ts"
```

- [ ] **Step 7: Verify the test runner works with zero tests**

Run: `npm run test`
Expected: Vitest reports `No test files found` (or `0 passed`) and exits without error —
this confirms the runner is wired correctly before any real tests exist.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json .env.example .gitignore vitest.config.ts
git commit -m "chore: add Supabase/R2 dependencies and test runner scaffolding"
```

---

## Task 2: Cloudflare R2 — console setup

No code in this task — it produces the R2 credentials Task 4 needs. Cloudflare account
required (free tier, no domain needed).

**Files:** none (values go into your local, gitignored `.env.local`, not committed).

- [ ] **Step 1: Create the bucket**

At [dash.cloudflare.com](https://dash.cloudflare.com): **R2 Object Storage** → **Create
bucket** → name `remys-media` → Location: Automatic → Create.

- [ ] **Step 2: Enable public access**

Bucket → **Settings** → **Public Access** → **Allow Access** → confirm. Copy the issued
`https://pub-<hash>.r2.dev` URL.

- [ ] **Step 3: Create a scoped API token**

R2 overview → **Manage R2 API Tokens** → **Create API Token** → permission **Object Read
& Write** → scope to bucket `remys-media` only → Create. Copy the **Access Key ID**,
**Secret Access Key**, and the account endpoint shown
(`https://<account_id>.r2.cloudflarestorage.com`) — the secret is shown once.

- [ ] **Step 4: Configure CORS**

Bucket → **Settings** → **CORS Policy** → add:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

(Add your production origin to `AllowedOrigins` once it exists — Plan 2/3 concern, not
blocking now.)

- [ ] **Step 5: Fill in `.env.local`**

Create `.env.local` (gitignored) at the repo root, copy `.env.example`'s content into it,
and fill in the five `R2_*` values from steps 1-3 (`R2_BUCKET_NAME` is already
`remys-media` in the example).

- [ ] **Step 6: Verify public access works**

```bash
curl -I https://pub-<hash>.r2.dev/does-not-exist
```
Expected: `HTTP/1.1 404` (or `403`) from Cloudflare — NOT a connection error or DNS
failure. A 404 confirms the public endpoint itself is live; the object legitimately
doesn't exist yet.

No commit — nothing to commit in this task.

---

## Task 3: Supabase — console setup and schema

**Files:**
- Create: `supabase/schema.sql`

**Interfaces:**
- Produces: `albums`, `album_photos`, `site_settings` tables in Postgres, matching the
  types Task 5 will define in `lib/supabase/types.ts`.

- [ ] **Step 1: Create the Supabase project**

At [supabase.com/dashboard](https://supabase.com/dashboard): **New project** → name
`remys-wedding` → set a database password (save it) → choose a region → Create. Wait for
provisioning to finish.

- [ ] **Step 2: Write the schema file**

Create `supabase/schema.sql`:

```sql
-- albums: shared table for all three categories (pre_wedding, wedding, video)
create table albums (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('pre_wedding', 'wedding', 'video')),
  title text not null,
  slug text not null unique,
  event_date date,
  description text,
  cover_image_key text,
  highlight_video_url text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- album_photos: photos belonging to an album (empty for pure-video albums)
create table album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references albums(id) on delete cascade,
  image_key text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- site_settings: single row, id fixed at 1
create table site_settings (
  id int primary key default 1 check (id = 1),
  email text,
  zalo_link text,
  facebook_link text,
  instagram_link text,
  hero_video_key text,
  updated_at timestamptz not null default now()
);

insert into site_settings (id) values (1) on conflict (id) do nothing;

-- Row Level Security: public (anon) role can only SELECT published content.
-- No insert/update/delete policies exist for any role — all writes go through
-- the service-role client, which bypasses RLS entirely.

alter table albums enable row level security;
create policy "public read published albums"
  on albums for select
  using (is_published = true);

alter table album_photos enable row level security;
create policy "public read photos of published albums"
  on album_photos for select
  using (
    exists (
      select 1 from albums
      where albums.id = album_photos.album_id
      and albums.is_published = true
    )
  );

alter table site_settings enable row level security;
create policy "public read site settings"
  on site_settings for select
  using (true);
```

- [ ] **Step 3: Run the schema**

Supabase dashboard → **SQL Editor** → **New query** → paste the full contents of
`supabase/schema.sql` → **Run**. Expected: "Success. No rows returned."

- [ ] **Step 4: Verify the tables**

Dashboard → **Table Editor**. Confirm `albums`, `album_photos`, and `site_settings` all
exist, and `site_settings` has exactly one row with `id = 1`.

- [ ] **Step 5: Fill in the Supabase env vars**

Dashboard → **Project Settings** → **API**. Copy into `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` ← "Project URL"
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ← "anon public" key
- `SUPABASE_SERVICE_ROLE_KEY` ← "service_role" key (⚠️ full DB access, never expose to
  the client)

- [ ] **Step 6: Commit the schema file**

```bash
git add supabase/schema.sql
git commit -m "feat: add Supabase schema for albums, album_photos, site_settings"
```

---

## Task 4: R2 client — presign, delete, key building, URL rendering

**Files:**
- Create: `lib/r2.ts`
- Create: `lib/r2.test.ts`

**Interfaces:**
- Consumes: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
  `R2_BUCKET_NAME`, `R2_PUBLIC_BASE_URL` env vars (Task 2).
- Produces:
  - `imageUrl(key: string): string`
  - `buildPhotoKey(albumSlug: string, fileName: string): string`
  - `buildHeroKey(fileName: string): string`
  - `presignUpload(key: string, contentType: string): Promise<string>`
  - `deleteObject(key: string): Promise<void>`

- [ ] **Step 1: Write the failing tests for the pure functions**

Create `lib/r2.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test`
Expected: FAIL — `lib/r2.ts` doesn't exist yet, so the import fails.

- [ ] **Step 3: Write `lib/r2.ts`**

```ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test`
Expected: PASS — all `lib/r2.test.ts` cases green.

- [ ] **Step 5: Manually verify presign + upload + delete against the real bucket**

Run: `npx tsx --env-file=.env.local -e "
import('./lib/r2.ts').then(async (r2) => {
  const key = 'site-assets/verify-task4.txt'
  const url = await r2.presignUpload(key, 'text/plain')
  const put = await fetch(url, { method: 'PUT', body: 'task 4 check', headers: { 'Content-Type': 'text/plain' } })
  console.log('PUT status:', put.status)
  const get = await fetch(r2.imageUrl(key))
  console.log('GET status:', get.status, 'body:', await get.text())
  await r2.deleteObject(key)
  const getAfterDelete = await fetch(r2.imageUrl(key))
  console.log('GET after delete status (expect 404):', getAfterDelete.status)
})
"`

Expected: `PUT status: 200`, `GET status: 200 body: task 4 check`,
`GET after delete status (expect 404): 404`.

- [ ] **Step 6: Commit**

```bash
git add lib/r2.ts lib/r2.test.ts
git commit -m "feat: add R2 client with presign, delete, and key/URL helpers"
```

---

## Task 5: Supabase clients + admin route gating

**Files:**
- Create: `lib/supabase/types.ts`
- Create: `lib/supabase/anon.ts`
- Create: `lib/supabase/admin.ts`
- Create: `proxy.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY` env vars (Task 3).
- Produces:
  - `type AlbumCategory = "pre_wedding" | "wedding" | "video"`
  - `type AlbumRow`, `type AlbumPhotoRow`, `type SiteSettingsRow`, `type Database`
    (all from `lib/supabase/types.ts`)
  - `createAnonClient(): SupabaseClient<Database>` (`lib/supabase/anon.ts`)
  - `createAdminClient(): SupabaseClient<Database>` (`lib/supabase/admin.ts`)
  - `/admin/*` requests without a Supabase session redirect to `/admin/login`
    (`/admin/login` itself does not redirect, to avoid a loop)

- [ ] **Step 1: Write `lib/supabase/types.ts`**

```ts
export type AlbumCategory = "pre_wedding" | "wedding" | "video"

export type AlbumRow = {
  id: string
  category: AlbumCategory
  title: string
  slug: string
  event_date: string | null
  description: string | null
  cover_image_key: string | null
  highlight_video_url: string | null
  is_featured: boolean
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type AlbumPhotoRow = {
  id: string
  album_id: string
  image_key: string
  sort_order: number
  created_at: string
}

export type SiteSettingsRow = {
  id: number
  email: string | null
  zalo_link: string | null
  facebook_link: string | null
  instagram_link: string | null
  hero_video_key: string | null
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      albums: {
        Row: AlbumRow
        Insert: Partial<AlbumRow> &
          Pick<AlbumRow, "category" | "title" | "slug">
        Update: Partial<AlbumRow>
      }
      album_photos: {
        Row: AlbumPhotoRow
        Insert: Partial<AlbumPhotoRow> &
          Pick<AlbumPhotoRow, "album_id" | "image_key">
        Update: Partial<AlbumPhotoRow>
      }
      site_settings: {
        Row: SiteSettingsRow
        Insert: Partial<SiteSettingsRow>
        Update: Partial<SiteSettingsRow>
      }
    }
  }
}
```

- [ ] **Step 2: Write `lib/supabase/anon.ts`**

Used for public reads (RLS-restricted to published rows). No cookies involved — safe to
call from Server Components, Route Handlers, or a standalone script.

```ts
import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/types"

export function createAnonClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Write `lib/supabase/admin.ts`**

```ts
import "server-only"

import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/types"

export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

- [ ] **Step 4: Write `proxy.ts` at the repo root**

```ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAdminRoute = pathname.startsWith("/admin")
  const isLoginRoute = pathname === "/admin/login"

  if (isAdminRoute && !isLoginRoute && !user) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*"],
}
```

- [ ] **Step 5: Verify the redirect gate manually**

Run: `npm run dev`, then in another terminal:

```bash
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" http://localhost:3000/admin
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin/login
```

Expected: first command prints `307 -> http://localhost:3000/admin/login` (redirected,
since no session exists yet); second prints a plain `404` (route doesn't exist until
Plan 2 — the important thing is it's NOT a redirect, confirming the login-route
exclusion works). Stop the dev server after.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase/types.ts lib/supabase/anon.ts lib/supabase/admin.ts proxy.ts
git commit -m "feat: add Supabase clients and admin route session gating"
```

---

## Task 6: Data access layer — albums and settings

**Files:**
- Create: `lib/data/albums.ts`
- Create: `lib/data/settings.ts`
- Create: `scripts/verify-foundation.ts`

**Interfaces:**
- Consumes: `createAnonClient`, `createAdminClient` (Task 5), `presignUpload`,
  `deleteObject`, `buildPhotoKey`, `imageUrl` (Task 4), `AlbumRow`, `AlbumPhotoRow`,
  `SiteSettingsRow`, `AlbumCategory` (Task 5).
- Produces (consumed by Plan 2 admin routes and Plan 3 public pages):
  - `getPublishedAlbumsByCategory(category: AlbumCategory): Promise<AlbumRow[]>`
  - `getFeaturedAlbums(): Promise<AlbumRow[]>`
  - `getPublishedAlbumBySlug(slug: string): Promise<(AlbumRow & { photos: AlbumPhotoRow[] }) | null>`
  - `listAllAlbums(): Promise<AlbumRow[]>`
  - `createAlbum(input: { category: AlbumCategory; title: string; slug: string; eventDate?: string | null; description?: string | null }): Promise<AlbumRow>`
  - `updateAlbum(id: string, patch: Partial<Pick<AlbumRow, "title" | "slug" | "event_date" | "description" | "cover_image_key" | "highlight_video_url" | "is_featured" | "is_published" | "sort_order">>): Promise<AlbumRow>`
  - `deleteAlbum(id: string): Promise<void>`
  - `addPhoto(albumId: string, imageKey: string, sortOrder: number): Promise<AlbumPhotoRow>`
  - `deletePhoto(photoId: string): Promise<void>`
  - `getSiteSettings(): Promise<SiteSettingsRow>`
  - `updateSiteSettings(patch: Partial<Pick<SiteSettingsRow, "email" | "zalo_link" | "facebook_link" | "instagram_link" | "hero_video_key">>): Promise<SiteSettingsRow>`

- [ ] **Step 1: Write `lib/data/albums.ts`**

```ts
import "server-only"

import { deleteObject } from "@/lib/r2"
import { createAdminClient } from "@/lib/supabase/admin"
import { createAnonClient } from "@/lib/supabase/anon"
import type { AlbumCategory, AlbumPhotoRow, AlbumRow } from "@/lib/supabase/types"

export type AlbumWithPhotos = AlbumRow & { photos: AlbumPhotoRow[] }

// --- Public reads (anon client, RLS-restricted to published rows) ---

export async function getPublishedAlbumsByCategory(
  category: AlbumCategory
): Promise<AlbumRow[]> {
  const supabase = createAnonClient()
  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .eq("category", category)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
  if (error) throw error
  return data
}

export async function getFeaturedAlbums(): Promise<AlbumRow[]> {
  const supabase = createAnonClient()
  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .eq("is_featured", true)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
  if (error) throw error
  return data
}

export async function getPublishedAlbumBySlug(
  slug: string
): Promise<AlbumWithPhotos | null> {
  const supabase = createAnonClient()

  const { data: album, error } = await supabase
    .from("albums")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
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

// --- Admin reads/writes (service-role client, bypasses RLS) ---

export async function listAllAlbums(): Promise<AlbumRow[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return data
}

export async function createAlbum(input: {
  category: AlbumCategory
  title: string
  slug: string
  eventDate?: string | null
  description?: string | null
}): Promise<AlbumRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("albums")
    .insert({
      category: input.category,
      title: input.title,
      slug: input.slug,
      event_date: input.eventDate ?? null,
      description: input.description ?? null,
    })
    .select("*")
    .single()
  if (error) throw error
  return data
}

export async function updateAlbum(
  id: string,
  patch: Partial<
    Pick<
      AlbumRow,
      | "title"
      | "slug"
      | "event_date"
      | "description"
      | "cover_image_key"
      | "highlight_video_url"
      | "is_featured"
      | "is_published"
      | "sort_order"
    >
  >
): Promise<AlbumRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("albums")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single()
  if (error) throw error
  return data
}

export async function deleteAlbum(id: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: photos, error: photosError } = await supabase
    .from("album_photos")
    .select("image_key")
    .eq("album_id", id)
  if (photosError) throw photosError

  const { data: album, error: albumError } = await supabase
    .from("albums")
    .select("cover_image_key")
    .eq("id", id)
    .maybeSingle()
  if (albumError) throw albumError

  const { error: deleteError } = await supabase
    .from("albums")
    .delete()
    .eq("id", id)
  if (deleteError) throw deleteError

  const keys = [
    ...(photos ?? []).map((p) => p.image_key),
    album?.cover_image_key,
  ].filter((key): key is string => Boolean(key))

  await Promise.all(
    keys.map((key) =>
      deleteObject(key).catch((err) =>
        console.error("R2 cleanup failed for", key, err)
      )
    )
  )
}

export async function addPhoto(
  albumId: string,
  imageKey: string,
  sortOrder: number
): Promise<AlbumPhotoRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("album_photos")
    .insert({ album_id: albumId, image_key: imageKey, sort_order: sortOrder })
    .select("*")
    .single()
  if (error) throw error
  return data
}

export async function deletePhoto(photoId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: photo, error: fetchError } = await supabase
    .from("album_photos")
    .select("image_key")
    .eq("id", photoId)
    .maybeSingle()
  if (fetchError) throw fetchError

  const { error: deleteError } = await supabase
    .from("album_photos")
    .delete()
    .eq("id", photoId)
  if (deleteError) throw deleteError

  if (photo?.image_key) {
    await deleteObject(photo.image_key).catch((err) =>
      console.error("R2 cleanup failed for", photo.image_key, err)
    )
  }
}
```

- [ ] **Step 2: Write `lib/data/settings.ts`**

```ts
import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { createAnonClient } from "@/lib/supabase/anon"
import type { SiteSettingsRow } from "@/lib/supabase/types"

export async function getSiteSettings(): Promise<SiteSettingsRow> {
  const supabase = createAnonClient()
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single()
  if (error) throw error
  return data
}

export async function updateSiteSettings(
  patch: Partial<
    Pick<
      SiteSettingsRow,
      "email" | "zalo_link" | "facebook_link" | "instagram_link" | "hero_video_key"
    >
  >
): Promise<SiteSettingsRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("site_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("*")
    .single()
  if (error) throw error
  return data
}
```

- [ ] **Step 3: Write the end-to-end verification script**

Create `scripts/verify-foundation.ts`:

```ts
import { config } from "dotenv"
config({ path: ".env.local" })

import { randomUUID } from "node:crypto"

import {
  addPhoto,
  deleteAlbum,
  createAlbum,
  getPublishedAlbumBySlug,
  updateAlbum,
} from "../lib/data/albums"
import { getSiteSettings, updateSiteSettings } from "../lib/data/settings"
import { buildPhotoKey, imageUrl, presignUpload } from "../lib/r2"

async function main() {
  console.log("1. Creating a draft (unpublished) album...")
  const slug = `verify-${randomUUID()}`
  const album = await createAlbum({
    category: "wedding",
    title: "Verify Script",
    slug,
  })
  console.log("   created:", album.id)

  console.log("2. Uploading a test photo to R2 via a presigned URL...")
  const key = buildPhotoKey(slug, "test.txt")
  const uploadUrl = await presignUpload(key, "text/plain")
  const putRes = await fetch(uploadUrl, {
    method: "PUT",
    body: "hello from verify script",
    headers: { "Content-Type": "text/plain" },
  })
  if (!putRes.ok) throw new Error(`R2 PUT failed: ${putRes.status}`)
  await addPhoto(album.id, key, 0)
  console.log("   uploaded key:", key)

  console.log("3. Confirming the unpublished album is NOT publicly readable...")
  const beforePublish = await getPublishedAlbumBySlug(slug)
  if (beforePublish !== null) {
    throw new Error("expected null for an unpublished album (RLS should block it)")
  }

  console.log("4. Publishing the album...")
  await updateAlbum(album.id, { is_published: true })
  const afterPublish = await getPublishedAlbumBySlug(slug)
  if (!afterPublish || afterPublish.photos.length !== 1) {
    throw new Error("expected a published album with exactly 1 photo")
  }
  console.log("   public read OK, photo URL:", imageUrl(afterPublish.photos[0].image_key))

  console.log("5. Fetching the uploaded object over its public URL...")
  const getRes = await fetch(imageUrl(key))
  if (!getRes.ok) throw new Error(`R2 public GET failed: ${getRes.status}`)
  const body = await getRes.text()
  if (body !== "hello from verify script") {
    throw new Error(`unexpected object content: ${body}`)
  }

  console.log("6. Checking site_settings read/write...")
  const settings = await getSiteSettings()
  await updateSiteSettings({ email: settings.email ?? "hello@remys.vn" })

  console.log("7. Deleting the album (should cascade rows + clean up the R2 object)...")
  await deleteAlbum(album.id)
  const getAfterDelete = await fetch(imageUrl(key))
  if (getAfterDelete.ok) {
    throw new Error("expected the R2 object to be deleted after album delete")
  }

  console.log("\nAll checks passed.")
}

main().catch((err) => {
  console.error("\nVerification FAILED:", err)
  process.exit(1)
})
```

- [ ] **Step 4: Run the verification script**

Run: `npm run verify:foundation`
Expected: steps 1-7 each print their "OK"/status line in order, ending with
`All checks passed.` and exit code 0. If it fails, the printed step number tells you
which layer (R2 credentials/CORS, Supabase schema/RLS, or the data-layer code) to check
first.

- [ ] **Step 5: Type-check and lint the whole foundation**

Run: `npm run typecheck && npm run lint`
Expected: both pass with no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/data/albums.ts lib/data/settings.ts scripts/verify-foundation.ts
git commit -m "feat: add albums/settings data access layer with end-to-end verification script"
```
