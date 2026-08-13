# Remy's Wedding — Photography/Media Business Site — Design Spec

Date: 2026-08-13
Status: Approved for prototyping (public-facing UI); admin + Supabase wiring to follow after visual review.

## 1. Purpose

Marketing + portfolio site for a wedding photography/media business. Showcases work in
three categories — pre-wedding, wedding, and wedding video — lets prospective clients
browse albums and contact the business, and gives the owner a simple admin panel to
manage albums/media without touching code.

## 2. Architecture

- **Frontend**: Next.js 16 (App Router, already scaffolded), React 19, Tailwind 4,
  shadcn/ui, Framer Motion for animation.
- **Backend**: Supabase — Postgres (album/photo/settings data), Storage (photos + hero
  video), Auth (single admin account, email/password).
- **Video** (highlight clips + wedding-video category): embedded via YouTube/Vimeo —
  only a URL/ID is stored, no video files hosted on Supabase.
- **Hosting**: Vercel, connected to the GitHub repo for CI/CD on push.
- **Domain**: purchased separately, DNS pointed at Vercel per Vercel's domain setup.

## 3. Data model (Supabase Postgres)

### `albums`
One shared table for all three categories — they have identical shape.

| column | type | notes |
|---|---|---|
| id | uuid, pk | |
| category | text enum: `pre_wedding` \| `wedding` \| `video` | |
| title | text | |
| slug | text, unique | URL-friendly, per album |
| event_date | date, nullable | |
| description | text, nullable | |
| cover_image_url | text | shown on listing cards |
| highlight_video_url | text, nullable | YouTube/Vimeo URL. Optional accent clip for `pre_wedding`/`wedding`; the primary content for `video` category |
| is_featured | boolean, default false | surfaces album on homepage |
| is_published | boolean, default false | lets owner stage an album before it's public |
| sort_order | int | manual ordering within a category |
| created_at, updated_at | timestamptz | |

### `album_photos`
Photos belonging to an album (empty for pure-video albums).

| column | type | notes |
|---|---|---|
| id | uuid, pk | |
| album_id | uuid, fk → albums.id, on delete cascade | |
| image_url | text | Supabase Storage public URL |
| sort_order | int | |
| created_at | timestamptz | |

### `site_settings`
Single row, editable from `/admin/settings` — avoids redeploys for things that
change independently of code.

| column | type | notes |
|---|---|---|
| id | int, fixed = 1 | |
| email | text | |
| zalo_link | text | |
| facebook_link | text | |
| instagram_link | text | |
| hero_video_url | text | muted looping background clip on homepage hero |
| updated_at | timestamptz | |

### Storage buckets
- `album-photos` (public read) — album photos, uploaded via admin.
- `site-assets` (public read) — hero background video and similar site-wide assets.

## 4. Public site

| Route | Content |
|---|---|
| `/` | Hero with muted autoplay looping background video, short intro copy, links into the three categories, "Featured albums" section (query `is_featured = true AND is_published = true`, grouped by category), contact section (icons for email/Zalo/Facebook/Instagram, sourced from `site_settings`) |
| `/pre-wedding` | Grid of published `pre_wedding` albums (cover image, title, date) |
| `/wedding` | Same, for `wedding` |
| `/video-cuoi` | Same, for `video` |
| `/[category]/[slug]` | Album detail — photo grid/lightbox, plus `highlight_video_url` embed if present |

Visual direction: elegant, simple effects done well rather than many effects — Framer
Motion used for scroll-reveal on sections/cards, subtle hover states on album cards,
and a smooth hero entrance. No sound-on video, no autoplay video with audio.

## 5. Admin panel

Single admin account (Supabase Auth, email/password). All `/admin/*` routes gated by
middleware checking the Supabase session; unauthenticated requests redirect to
`/admin/login`.

| Route | Purpose |
|---|---|
| `/admin/login` | Email/password sign-in |
| `/admin` | Dashboard — count of albums per category |
| `/admin/albums` | List all albums, filter by category, toggle `is_published`/`is_featured`, create/delete |
| `/admin/albums/[id]` | Edit album metadata; upload/reorder/delete photos; set `highlight_video_url` |
| `/admin/settings` | Edit `site_settings` (contact links, hero video) |

No multi-user roles — out of scope per current needs (single owner-operator).

## 6. Deployment

1. Push repo to GitHub; connect the repo as a Vercel project.
2. Create a Supabase project; run migrations for the three tables + two storage
   buckets above.
3. Set Vercel environment variables: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-side only,
   used by admin write operations).
4. Purchase a domain, add it in Vercel project settings, point DNS per Vercel's
   instructions (A record or CNAME depending on registrar).

## 7. Explicitly out of scope (for now)

- Contact form / lead capture (contact is link-out only: mailto, Zalo, Facebook,
  Instagram).
- Multiple admin accounts or role-based permissions.
- Self-hosted video (all video is YouTube/Vimeo embeds).
- Hard limits on photos-per-album in code — current expected scale is small
  (~10–20 photos/album, a handful of albums), well within Supabase free tier.

## 8. Next step

Build a throwaway visual prototype of the public homepage (mock data, no Supabase
wiring yet) to validate look, feel, and animation direction before wiring up the
real data layer and admin panel.
