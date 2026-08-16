# Remy's Wedding — Backend: Supabase + Cloudflare R2 — Design Spec

Date: 2026-08-16
Status: Approved for implementation planning.
Supersedes: storage portion of `2026-08-13-wedding-photography-site-design.md` (that
doc's public routes, admin routes, and general architecture still stand — this doc
amends section 3 "Data model" storage columns and adds the storage/upload layer that
doc deferred).

## 1. Purpose

Wire the mocked frontend (`lib/mock-albums.ts`, static screens) to a real backend:
Supabase for structured data + admin auth, Cloudflare R2 for all binary files (album
photos, hero background video). Frontend UI/UX is already built and out of scope here.

## 2. Responsibility split

- **Supabase Postgres** — `albums`, `album_photos`, `site_settings` tables. Source of
  truth for all structured/queryable data.
- **Supabase Auth** — single admin account (email/password), gates `/admin/*`.
- **Cloudflare R2** — every binary file: album photos and the homepage hero video.
  Supabase Storage is not used.

Rationale: R2 has no egress fees (album photo galleries are read-heavy — every visitor
loads 10-20 images per album view), and keeping storage on a separate service from the
DB is a clean boundary regardless.

## 3. Data model changes

Columns that referenced Supabase Storage URLs now store an **R2 object key**, not a
full URL. A single R2 bucket (`remys-media`) holds everything under two key prefixes:
`album-photos/` and `site-assets/`.

| table | old column (2026-08-13 spec) | new column | example value |
|---|---|---|---|
| `albums` | `cover_image_url` (text) | `cover_image_key` (text) | `album-photos/linh-minh-tam-dao/cover.jpg` |
| `album_photos` | `image_url` (text) | `image_key` (text) | `album-photos/linh-minh-tam-dao/a1b2c3.jpg` |
| `site_settings` | `hero_video_url` (text) | `hero_video_key` (text) | `site-assets/hero.mp4` |

`albums.highlight_video_url` is unchanged — it's a YouTube/Vimeo embed URL, not an R2
object, per the 2026-08-13 spec.

**Why a key, not a full URL:** the public base URL for R2 objects will change once a
domain exists (r2.dev → custom domain, see section 7). Storing only the key means that
migration is a single env var change, not a database migration. A small helper,
`imageUrl(key: string): string`, concatenates `R2_PUBLIC_BASE_URL` + key at render time.

All other tables/columns from the 2026-08-13 spec (section 3) are unchanged.

## 4. R2 bucket layout

One bucket: `remys-media`.

```
album-photos/<album-slug>/<uuid>.<ext>
site-assets/hero.<ext>
```

Public read access is enabled on the bucket (photos and the hero video are public
marketing content — no signed GET URLs needed). Only writes (PUT/DELETE) require
authentication, done server-side with a scoped R2 API token.

## 5. Upload flow

Browser uploads directly to R2 via a presigned URL — the file never passes through the
Next.js server, avoiding server memory/bandwidth cost for multi-MB photo uploads.

```
1. Admin selects a file in /admin/albums/[id]
2. Browser → POST /api/uploads/presign { fileName, contentType, folder }
   Route handler (Supabase-session-gated) generates an R2 presigned PUT URL
   server-side using the R2 service credentials. Returns { uploadUrl, key }.
3. Browser → PUT <uploadUrl>  (the file, directly to R2)
4. Browser → POST /api/albums/[id]/photos { key, sortOrder }
   Route handler inserts the row into album_photos.
5. UI refreshes the photo list, rendering via imageUrl(key).
```

The same `/api/uploads/presign` endpoint serves both `album-photos/` (album photo
uploads) and `site-assets/` (hero video upload from `/admin/settings`) via the `folder`
param.

## 6. Delete flow

Deleting a photo or album removes both the Postgres row(s) and the corresponding R2
object(s), so storage doesn't accumulate orphaned files:

```
DELETE /api/albums/[id]/photos/[photoId]
  → delete the album_photos row, then delete the R2 object for its key.
    If the R2 delete call fails, log it — do not roll back the DB row
    (an orphaned R2 file is harmless; a stuck DB row blocks the admin).

DELETE /api/albums/[id]
  → for each album_photos row (including cover image), delete its R2 object,
    then delete the album row (cascades album_photos via FK).
```

## 7. Image/video serving & domain rollout

No domain is registered yet, so serving happens in two phases. Because URLs are
derived from stored keys (section 3), moving between phases requires only an env var
change — no code or data changes.

**Phase 1 (now — no domain):**
- Enable the bucket's public R2.dev URL (`https://pub-<hash>.r2.dev`) in the Cloudflare
  dashboard.
- Set `R2_PUBLIC_BASE_URL` to that URL. Images/video are served as-is (no resizing).
- Note: Cloudflare documents r2.dev subdomains as intended for testing/development, not
  sustained production traffic — this phase is meant to be temporary.

**Phase 2 (once a domain is purchased, per the 2026-08-13 spec section 6):**
- Add the domain to Cloudflare (nameserver change at the registrar).
- In the R2 bucket → Settings → Custom Domains, attach `cdn.<domain>`.
- Update `R2_PUBLIC_BASE_URL` to `https://cdn.<domain>`.
- Optionally enable Cloudflare Image Resizing (`/cdn-cgi/image/...` URL transforms) so
  the app can request `width=800` for grid cards vs. full-res for the lightbox from a
  single uploaded original, instead of serving one fixed size everywhere. This is an
  additive change to `imageUrl()` (add a `width` param), not a re-architecture.

## 8. Setup — Cloudflare R2 (step-by-step)

1. Sign in at dash.cloudflare.com (no domain required for R2).
2. **R2 Object Storage** → **Create bucket** → name `remys-media`, location Automatic.
3. Bucket → **Settings** → **Public Access** → **Allow Access** → note the issued
   `pub-<hash>.r2.dev` URL.
4. R2 overview → **Manage R2 API Tokens** → **Create API Token** → permission **Object
   Read & Write**, scoped to the `remys-media` bucket only. Save the Access Key ID,
   Secret Access Key, and account endpoint (`https://<account_id>.r2.cloudflarestorage.com`)
   immediately — the secret is shown once.
5. Bucket → **Settings** → **CORS Policy** → allow `PUT`, `GET` from
   `http://localhost:3000` and the eventual production domain, header `Content-Type`.
   Required — without this, the browser's direct PUT to R2 is blocked by CORS.
6. `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner` (R2 is S3-API
   compatible; this is Cloudflare's documented integration path for non-Workers
   runtimes like Vercel/Next.js).
7. Add `lib/r2.ts`: an `S3Client` configured with the R2 endpoint + credentials, plus
   `presignUpload(key, contentType)`, `deleteObject(key)`, `imageUrl(key)`.

## 9. Env vars

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server-only, admin writes

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=                # server-only
R2_SECRET_ACCESS_KEY=            # server-only
R2_BUCKET_NAME=remys-media
R2_PUBLIC_BASE_URL=              # pub-<hash>.r2.dev now, cdn.<domain> after phase 2
```

Set locally in `.env.local` and in Vercel project settings (Production + Preview).

## 10. New packages

```
@supabase/supabase-js
@supabase/ssr
@aws-sdk/client-s3
@aws-sdk/s3-request-presigner
```

## 11. API route surface

```
POST   /api/uploads/presign            → { uploadUrl, key }
GET    /api/albums                     → list (admin) / published (public, via direct query)
POST   /api/albums                     → create album
PATCH  /api/albums/[id]                → update album metadata / publish / feature toggle
DELETE /api/albums/[id]                → delete album + its R2 objects (section 6)
POST   /api/albums/[id]/photos         → attach an uploaded photo to an album
DELETE /api/albums/[id]/photos/[id]    → remove a photo (DB + R2, section 6)
PATCH  /api/settings                   → update site_settings (contact links, hero video key)
```

Public read paths (`/`, `/pre-wedding`, `/wedding`, `/video-cuoi`, `/[category]/[slug]`)
query Supabase directly from server components — no API routes needed for reads.

Admin routes (`/admin/login`, `/admin`, `/admin/albums`, `/admin/albums/[id]`,
`/admin/settings`) are unchanged from the 2026-08-13 spec; middleware gates them on a
Supabase session.

## 12. Out of scope (unchanged from 2026-08-13 spec)

Contact form/lead capture, multi-admin/roles, self-hosted (non-embed) video, hard
photo-per-album limits.
