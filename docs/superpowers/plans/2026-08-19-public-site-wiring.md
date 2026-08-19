# Public Site Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the public-facing site's mock data (`lib/mock-albums.ts`, `lib/mock-videos.ts`, hardcoded `APP_CONFIG.contact`) with real reads from Supabase (albums, videos, hero images, site settings), so the home page, `/pre-wedding`, `/wedding`, `/videos`, album detail pages, and `/contact` all render live studio data.

**Architecture:** All public pages are Next.js Server Components. Each `app/(site)/**/page.tsx` fetches data server-side via the existing `lib/data/*.ts` functions (anon Supabase client, RLS-restricted to published rows) and passes it down as props into the `screens/*` components, which become pure prop-driven presentational components (no more internal `mock-albums`/`mock-videos` imports or client-side mock state). A small set of new shared, DB-independent presentation helpers (`lib/albums.ts`, `lib/videos.ts`, `lib/contact.ts`, `lib/socials.ts`) replace the non-data exports currently living in the mock files, since several ADMIN screens also depend on them.

**Tech Stack:** Next.js 16 App Router (Server Components, async `params`), Supabase Postgres (`lib/data/*.ts`, anon client), Cloudflare R2 (`lib/r2-url.ts` `publicImageUrl`), TypeScript, Tailwind, framer-motion (unchanged).

**Spec:** No separate spec doc — this plan is scoped directly from the existing mock-data architecture (`lib/mock-albums.ts`, `lib/mock-videos.ts`) and two explicit product decisions from the user:
- Album credits: keep the hardcoded credits section, but the "Địa điểm" (location) value must come from real album data — the rest (Chụp ảnh/Quay phim/Trang phục/Trang điểm) stays hardcoded.
- Homepage featured albums: use the real `is_featured` flag from the admin panel (`getFeaturedAlbums()`), not "most recent".
- Phone number: add a `phone` column to `site_settings` (no existing column) and wire it into both the admin Settings screen and the public `/contact` page.

## Global Constraints

- Every public page stays a Server Component doing its own `await` data fetch — no client-side react-query on the public site (react-query is admin-only, per the existing architecture).
- `lib/data/*.ts` functions are `"server-only"` — never import them from a `"use client"` file. Presentation-only helpers (`lib/albums.ts`, `lib/videos.ts`, `lib/contact.ts`, `lib/socials.ts`) must NOT have `"server-only"`, since several are consumed by client components (`AlbumLink`, `AlbumThumb` callers, `ContactSection`, `FloatingSocial`).
- `getSiteSettings()` must be wrapped in React's `cache()` so it can be called once per page tree (layout + page) without duplicate DB round-trips in the same request.
- Any DB schema change (the new `phone` column) requires the user to run the `alter table` statement live in the Supabase SQL Editor, exactly like the earlier `hero_video_url` rename — call this out explicitly as a manual step, do not attempt to run SQL yourself.
- Preserve all existing visual/animation behavior (Tailwind classes, framer-motion variants, Carousel/dot-indicator UI) — this plan changes data plumbing and prop shapes only, not the design.
- `lib/mock-albums.ts` and `lib/mock-videos.ts` must not be deleted until every remaining import (grep-verified) has been migrated, including the ADMIN screens that import `CATEGORY_LABEL`/`AlbumCategory`/`videoThumbnail` from them.

---

## Task 1: Add `phone` column to `site_settings`

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `lib/supabase/types.ts`

**Interfaces:**
- Produces: `SiteSettingsRow.phone: string | null`, used by every later task touching settings.

- [ ] **Step 1: Ask the user to run the migration in the Supabase SQL Editor**

Tell the user to run this in their Supabase project's SQL Editor (same manual pattern as the earlier `hero_video_url` rename):

```sql
alter table site_settings add column phone text;
```

Wait for the user to confirm it ran successfully before continuing.

- [ ] **Step 2: Update `supabase/schema.sql` to match**

In `supabase/schema.sql`, find the `site_settings` table definition:

```sql
-- site_settings: single row, id fixed at 1
create table site_settings (
  id int primary key default 1 check (id = 1),
  email text,
  address text,
  zalo_link text,
  facebook_link text,
  instagram_link text,
  hero_background_mode text not null default 'video'
    check (hero_background_mode in ('video', 'images')),
  hero_video_url text,
  updated_at timestamptz not null default now()
);
```

Change it to:

```sql
-- site_settings: single row, id fixed at 1
create table site_settings (
  id int primary key default 1 check (id = 1),
  email text,
  address text,
  phone text,
  zalo_link text,
  facebook_link text,
  instagram_link text,
  hero_background_mode text not null default 'video'
    check (hero_background_mode in ('video', 'images')),
  hero_video_url text,
  updated_at timestamptz not null default now()
);
```

- [ ] **Step 3: Update `SiteSettingsRow` in `lib/supabase/types.ts`**

In `lib/supabase/types.ts`, change:

```ts
export type SiteSettingsRow = {
  id: number
  email: string | null
  address: string | null
  zalo_link: string | null
  facebook_link: string | null
  instagram_link: string | null
  hero_background_mode: HeroBackgroundMode
  hero_video_url: string | null
  updated_at: string
}
```

to:

```ts
export type SiteSettingsRow = {
  id: number
  email: string | null
  address: string | null
  phone: string | null
  zalo_link: string | null
  facebook_link: string | null
  instagram_link: string | null
  hero_background_mode: HeroBackgroundMode
  hero_video_url: string | null
  updated_at: string
}
```

- [ ] **Step 4: Verify typecheck**

Run: `pnpm typecheck`
Expected: passes (this only widens a type; nothing consumes `phone` yet).

- [ ] **Step 5: Commit**

```bash
git add supabase/schema.sql lib/supabase/types.ts
git commit -m "feat: add phone column to site_settings"
```

---

## Task 2: Create `lib/albums.ts` — shared album presentation helpers

This file replaces every non-mock-data export currently in `lib/mock-albums.ts` (labels, formatting, href building, credits, and now two new DB-row-to-presentation mappers), so both the admin panel and the public site can drop their `lib/mock-albums` imports independently.

**Files:**
- Create: `lib/albums.ts`

**Interfaces:**
- Consumes: `AlbumCategory`, `AlbumRow` from `@/lib/supabase/types`; `AlbumWithPhotos` (type-only) from `@/lib/data/albums`; `publicImageUrl` from `@/lib/r2-url`.
- Produces: `AlbumCredit`, `AlbumCardData`, `AlbumDetailData` types; `CATEGORY_LABEL`, `CATEGORY_TITLE` constants; `formatMonthYearVi(dateIso: string): string`; `albumHref(album: Pick<AlbumCardData, "category" | "slug">): string`; `buildAlbumCredits(location: string): AlbumCredit[]`; `toAlbumCardData(album: AlbumRow): AlbumCardData`; `toAlbumDetailData(album: AlbumWithPhotos): AlbumDetailData` — all consumed by Tasks 7–16.

- [ ] **Step 1: Write `lib/albums.ts`**

```ts
import type { AlbumWithPhotos } from "@/lib/data/albums"
import { publicImageUrl } from "@/lib/r2-url"
import type { AlbumCategory, AlbumRow } from "@/lib/supabase/types"

export type { AlbumCategory }

export type AlbumCredit = { label: string; value: string }

/** Shape used everywhere an album is rendered as a card/thumbnail/link. */
export type AlbumCardData = {
  id: string
  slug: string
  category: AlbumCategory
  title: string
  location: string
  coverImage: string
}

/** Shape used by the album detail page. */
export type AlbumDetailData = {
  id: string
  slug: string
  category: AlbumCategory
  title: string
  location: string
  eventDate: string | null
  highlightVideoUrl: string | null
  photos: string[]
}

const VI_MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
]

export function formatMonthYearVi(dateIso: string) {
  const [year, month] = dateIso.split("-")
  return `${VI_MONTHS[Number(month) - 1]}, ${year}`
}

export const CATEGORY_LABEL: Record<AlbumCategory, string> = {
  pre_wedding: "Pre-wedding",
  wedding: "Wedding",
}

export const CATEGORY_TITLE: Record<AlbumCategory, string> = {
  pre_wedding: "Yêu, giữa thiên nhiên và ánh sáng",
  wedding: "Một ngày, trọn một đời",
}

export function albumHref(album: Pick<AlbumCardData, "category" | "slug">) {
  return album.category === "pre_wedding"
    ? `/pre-wedding/${album.slug}`
    : `/wedding/${album.slug}`
}

export function buildAlbumCredits(location: string): AlbumCredit[] {
  return [
    { label: "Địa điểm", value: location },
    { label: "Chụp ảnh", value: "Remy's Studio" },
    { label: "Quay phim", value: "Remy's Films (highlight)" },
    { label: "Trang phục", value: "Lộng Lẫy Bridal" },
    { label: "Trang điểm", value: "Mai Anh Makeup" },
  ]
}

export function toAlbumCardData(album: AlbumRow): AlbumCardData {
  return {
    id: album.id,
    slug: album.slug,
    category: album.category,
    title: album.title,
    location: album.location ?? "",
    coverImage: album.cover_image_key ? publicImageUrl(album.cover_image_key) : "",
  }
}

export function toAlbumDetailData(album: AlbumWithPhotos): AlbumDetailData {
  return {
    id: album.id,
    slug: album.slug,
    category: album.category,
    title: album.title,
    location: album.location ?? "",
    eventDate: album.event_date,
    highlightVideoUrl: album.highlight_video_url,
    photos: album.photos.map((photo) => publicImageUrl(photo.image_key)),
  }
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: passes. (`import type { AlbumWithPhotos } from "@/lib/data/albums"` is erased at compile time, so this file does NOT pull in `lib/data/albums.ts`'s `"server-only"` runtime import — safe for a client-importable module.)

- [ ] **Step 3: Commit**

```bash
git add lib/albums.ts
git commit -m "feat: add shared album presentation helpers"
```

---

## Task 3: Create `lib/videos.ts` — shared video presentation helpers

**Files:**
- Create: `lib/videos.ts`

**Interfaces:**
- Consumes: `getYouTubeId` from `@/lib/utils`.
- Produces: `VIDEO_CATEGORY_LABEL`, `VIDEO_CATEGORY_TITLE` constants; `videoThumbnail(youtubeUrl: string): string`.

- [ ] **Step 1: Write `lib/videos.ts`**

```ts
import { getYouTubeId } from "@/lib/utils"

export const VIDEO_CATEGORY_LABEL = "Video cưới"
export const VIDEO_CATEGORY_TITLE = "Cảm xúc, dựng thành chuyển động"

export function videoThumbnail(youtubeUrl: string) {
  return `https://img.youtube.com/vi/${getYouTubeId(youtubeUrl)}/hqdefault.jpg`
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add lib/videos.ts
git commit -m "feat: add shared video presentation helpers"
```

---

## Task 4: Create `lib/socials.ts` (`buildSocialLinks`) and `lib/contact.ts` (`resolveContactInfo`)

Replaces the static `SOCIAL_LINKS` array (which always read from `APP_CONFIG.contact.*Url`) with a function that takes real, resolved URLs. `resolveContactInfo` centralizes the "use `site_settings` value, fall back to `APP_CONFIG` if empty" logic so every page that needs contact info shares one implementation.

**Files:**
- Modify: `lib/socials.ts`
- Create: `lib/contact.ts`

**Interfaces:**
- Produces: `SocialUrls` type + `buildSocialLinks(urls: SocialUrls)` from `lib/socials.ts`; `ContactInfo` type + `resolveContactInfo(settings: SiteSettingsRow): ContactInfo` from `lib/contact.ts` — consumed by Task 15 (`ContactSection`, `FloatingSocial`, `ContactScreen`) and Task 16 (every `page.tsx`/`layout.tsx` that renders them).

- [ ] **Step 1: Rewrite `lib/socials.ts`**

Replace the entire file:

```ts
export type SocialUrls = {
  facebookUrl: string
  zaloUrl: string
  instagramUrl: string
}

export function buildSocialLinks(urls: SocialUrls) {
  return [
    { label: "Facebook", href: urls.facebookUrl, icon: "/icons8-facebook.svg" },
    { label: "Zalo", href: urls.zaloUrl, icon: "/zalo.svg" },
    { label: "Instagram", href: urls.instagramUrl, icon: "/icons8-instagram.svg" },
  ] as const
}
```

- [ ] **Step 2: Write `lib/contact.ts`**

```ts
import { APP_CONFIG } from "@/config/config"
import type { SocialUrls } from "@/lib/socials"
import type { SiteSettingsRow } from "@/lib/supabase/types"

export type ContactInfo = SocialUrls & {
  email: string
  address: string
  phone: string
}

export function resolveContactInfo(settings: SiteSettingsRow): ContactInfo {
  return {
    email: settings.email || APP_CONFIG.contact.email,
    address: settings.address || APP_CONFIG.contact.address,
    phone: settings.phone || APP_CONFIG.contact.phone,
    facebookUrl: settings.facebook_link || APP_CONFIG.contact.facebookUrl,
    zaloUrl: settings.zalo_link || APP_CONFIG.contact.zaloUrl,
    instagramUrl: settings.instagram_link || APP_CONFIG.contact.instagramUrl,
  }
}
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm typecheck`
Expected: fails at this point — `components/contact-section.tsx`, `components/floating-social.tsx`, and `screens/contact/index.tsx` still import the now-deleted `SOCIAL_LINKS`. This is expected; Task 15 fixes those call sites. Confirm the only errors are in those three files before continuing.

- [ ] **Step 4: Commit**

```bash
git add lib/socials.ts lib/contact.ts
git commit -m "feat: add contact info resolution and social link builder"
```

---

## Task 5: Data-layer additions — `getRecentPublishedAlbums`, cached `getSiteSettings`, `phone` in the settings patch

**Files:**
- Modify: `lib/data/albums.ts`
- Modify: `lib/data/settings.ts`

**Interfaces:**
- Produces: `getRecentPublishedAlbums(limit?: number): Promise<AlbumRow[]>` (used by Task 16's home page); `getSiteSettings` now wrapped in `cache()` (safe to call from both `layout.tsx` and every `page.tsx` in Task 16 without duplicate queries); `updateSiteSettings` patch type now accepts `phone`.

- [ ] **Step 1: Add `getRecentPublishedAlbums` to `lib/data/albums.ts`**

Add this function to `lib/data/albums.ts`, directly below `getFeaturedAlbums`:

```ts
export async function getRecentPublishedAlbums(limit = 8): Promise<AlbumRow[]> {
  const supabase = createAnonClient()
  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}
```

- [ ] **Step 2: Rewrite `lib/data/settings.ts`**

Replace the entire file:

```ts
import "server-only"

import { cache } from "react"

import { createAdminClient } from "@/lib/supabase/admin"
import { createAnonClient } from "@/lib/supabase/anon"
import type { SiteSettingsRow } from "@/lib/supabase/types"

export const getSiteSettings = cache(async (): Promise<SiteSettingsRow> => {
  const supabase = createAnonClient()
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single()
  if (error) throw error
  return data
})

export async function updateSiteSettings(
  patch: Partial<
    Pick<
      SiteSettingsRow,
      | "email"
      | "address"
      | "phone"
      | "zalo_link"
      | "facebook_link"
      | "instagram_link"
      | "hero_background_mode"
      | "hero_video_url"
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

- [ ] **Step 3: Verify typecheck**

Run: `pnpm typecheck`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add lib/data/albums.ts lib/data/settings.ts
git commit -m "feat: add recent-albums query and cache site settings reads"
```

---

## Task 6: Wire `phone` through the API and admin Settings screen

**Files:**
- Modify: `lib/api/schemas.ts`
- Modify: `lib/admin/schemas.ts`
- Modify: `lib/queries/settings/index.ts`
- Modify: `screens/admin/settings/index.tsx`

**Interfaces:**
- Consumes: `SiteSettingsRow.phone` (Task 1), `updateSiteSettings` (Task 5).
- Produces: end-to-end admin editing of `site_settings.phone`, verified live by the user.

- [ ] **Step 1: Add `phone` to `updateSettingsSchema` in `lib/api/schemas.ts`**

Change:

```ts
export const updateSettingsSchema = z.object({
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  zalo_link: z.string().nullable().optional(),
  facebook_link: z.string().nullable().optional(),
  instagram_link: z.string().nullable().optional(),
  hero_background_mode: z.enum(["video", "images"]).optional(),
  hero_video_url: z.string().nullable().optional(),
})
```

to:

```ts
export const updateSettingsSchema = z.object({
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  zalo_link: z.string().nullable().optional(),
  facebook_link: z.string().nullable().optional(),
  instagram_link: z.string().nullable().optional(),
  hero_background_mode: z.enum(["video", "images"]).optional(),
  hero_video_url: z.string().nullable().optional(),
})
```

- [ ] **Step 2: Add `phone` to `contactSettingsSchema` in `lib/admin/schemas.ts`**

Change:

```ts
export const contactSettingsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email")
    .email("Email không hợp lệ"),
  address: z.string().trim().min(1, "Vui lòng nhập địa chỉ"),
  zaloLink: urlOrEmpty(
```

to:

```ts
export const contactSettingsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email")
    .email("Email không hợp lệ"),
  address: z.string().trim().min(1, "Vui lòng nhập địa chỉ"),
  phone: z.string().trim().min(1, "Vui lòng nhập số điện thoại"),
  zaloLink: urlOrEmpty(
```

- [ ] **Step 3: Add `phone` to the `useUpdateSettings` patch type in `lib/queries/settings/index.ts`**

Change:

```ts
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
```

to:

```ts
    mutationFn: async (
      patch: Partial<
        Pick<
          SiteSettingsRow,
          | "email"
          | "address"
          | "phone"
          | "zalo_link"
          | "facebook_link"
          | "instagram_link"
          | "hero_background_mode"
          | "hero_video_url"
        >
      >
    ) => (await http.patch<SiteSettingsRow>("/settings", patch)).data,
```

- [ ] **Step 4: Add `phone` to the admin Settings screen (`screens/admin/settings/index.tsx`)**

Change the `ContactForm` type:

```ts
type ContactForm = {
  email: string
  address: string
  zaloLink: string
  facebookLink: string
  instagramLink: string
}
```

to:

```ts
type ContactForm = {
  email: string
  address: string
  phone: string
  zaloLink: string
  facebookLink: string
  instagramLink: string
}
```

Change the `useEffect` seeding block:

```ts
    setContactForm({
      email: settings.email ?? "",
      address: settings.address ?? "",
      zaloLink: settings.zalo_link ?? "",
      facebookLink: settings.facebook_link ?? "",
      instagramLink: settings.instagram_link ?? "",
    })
```

to:

```ts
    setContactForm({
      email: settings.email ?? "",
      address: settings.address ?? "",
      phone: settings.phone ?? "",
      zaloLink: settings.zalo_link ?? "",
      facebookLink: settings.facebook_link ?? "",
      instagramLink: settings.instagram_link ?? "",
    })
```

Change the `handleSaveContact` mutate payload:

```ts
    updateSettings.mutate(
      {
        email: contactForm.email,
        address: contactForm.address,
        zalo_link: contactForm.zaloLink,
        facebook_link: contactForm.facebookLink,
        instagram_link: contactForm.instagramLink,
      },
```

to:

```ts
    updateSettings.mutate(
      {
        email: contactForm.email,
        address: contactForm.address,
        phone: contactForm.phone,
        zalo_link: contactForm.zaloLink,
        facebook_link: contactForm.facebookLink,
        instagram_link: contactForm.instagramLink,
      },
```

Add a new phone `<Input>` block right after the Email field and before the Địa chỉ field:

```tsx
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
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={contactForm.phone}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, phone: e.target.value })
                  }
                  aria-invalid={Boolean(contactErrors.phone)}
                />
                {contactErrors.phone && (
                  <p className="text-xs text-destructive">{contactErrors.phone}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="address">Địa chỉ</Label>
```

(This replaces the existing Email block + the start of the Địa chỉ block — insert the new phone block between them, keep the rest of the Địa chỉ block unchanged.)

- [ ] **Step 5: Verify typecheck**

Run: `pnpm typecheck`
Expected: passes.

- [ ] **Step 6: Live verification with the user**

Start the dev server if not already running, open `/admin/settings`, and ask the user to fill in a phone number and save. Confirm the toast appears and the value persists on reload.

- [ ] **Step 7: Commit**

```bash
git add lib/api/schemas.ts lib/admin/schemas.ts lib/queries/settings/index.ts screens/admin/settings/index.tsx
git commit -m "feat: wire phone number field into admin settings"
```

---

## Task 7: Migrate admin screens off `lib/mock-albums`/`lib/mock-videos`

None of these six admin files use any *data* from the mock files — only `CATEGORY_LABEL`, `AlbumCategory`, and `videoThumbnail`, all of which now live in `lib/albums.ts`/`lib/videos.ts` (Tasks 2–3). This is a pure import-path swap.

**Files:**
- Modify: `screens/admin/albums-list/index.tsx`
- Modify: `screens/admin/albums-list/components/new-album-dialog.tsx`
- Modify: `screens/admin/albums-list/components/album-table.tsx`
- Modify: `screens/admin/album-detail/index.tsx`
- Modify: `screens/admin/dashboard/index.tsx`
- Modify: `screens/admin/videos-list/components/video-table.tsx`

- [ ] **Step 1: Update the four `CATEGORY_LABEL`/`AlbumCategory` imports**

In `screens/admin/albums-list/index.tsx`, `screens/admin/albums-list/components/new-album-dialog.tsx`, and `screens/admin/album-detail/index.tsx`, change:

```ts
import { CATEGORY_LABEL, type AlbumCategory } from "@/lib/mock-albums"
```

to:

```ts
import { CATEGORY_LABEL, type AlbumCategory } from "@/lib/albums"
```

In `screens/admin/albums-list/components/album-table.tsx` and `screens/admin/dashboard/index.tsx`, change:

```ts
import { CATEGORY_LABEL } from "@/lib/mock-albums"
```

to:

```ts
import { CATEGORY_LABEL } from "@/lib/albums"
```

- [ ] **Step 2: Update the `videoThumbnail` import**

In `screens/admin/videos-list/components/video-table.tsx`, change:

```ts
import { videoThumbnail } from "@/lib/mock-videos"
```

to:

```ts
import { videoThumbnail } from "@/lib/videos"
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm typecheck`
Expected: passes.

- [ ] **Step 4: Live verification with the user**

Ask the user to spot-check `/admin/albums`, `/admin/albums/[id]`, `/admin/dashboard`, and `/admin/videos` to confirm category labels and video thumbnails still render correctly.

- [ ] **Step 5: Commit**

```bash
git add screens/admin
git commit -m "refactor: migrate admin screens off mock-albums/mock-videos imports"
```

---

## Task 8: Retype `AlbumLink` and `AlbumThumb`

**Files:**
- Modify: `components/album-link.tsx`
- Verify (no change expected): `components/album-thumb.tsx`

**Interfaces:**
- Consumes: `AlbumCardData`, `albumHref` from `@/lib/albums` (Task 2).
- Produces: `AlbumLink` now typed against `AlbumCardData` instead of the deleted `MockAlbum` — consumed by every album-card-rendering component in Tasks 11, 12, 14.

- [ ] **Step 1: Rewrite `components/album-link.tsx`**

Replace the entire file:

```tsx
import Link from "next/link"

import { albumHref, type AlbumCardData } from "@/lib/albums"

export function AlbumLink({
  album,
  className,
  children,
}: {
  album: Pick<AlbumCardData, "category" | "slug">
  className?: string
  children: React.ReactNode
}) {
  return (
    <Link href={albumHref(album)} className={className}>
      {children}
    </Link>
  )
}
```

- [ ] **Step 2: Confirm `components/album-thumb.tsx` needs no change**

Read `components/album-thumb.tsx` — it already declares its own local `AlbumThumbItem = { title: string; location: string; coverImage: string }` type, structurally compatible with `AlbumCardData`. No edit needed here.

- [ ] **Step 3: Verify typecheck**

Run: `pnpm typecheck`
Expected: may still fail — every remaining caller of `<AlbumLink album={...}>` still passes a `MockAlbum`-shaped object from `lib/mock-albums`. If it fails, confirm the only errors are in `screens/home/components/album-film-row.tsx`, `screens/home/components/recent-stories.tsx`, `screens/album-list/components/album-grid.tsx`, `screens/album-list/components/wedding-grid.tsx`, `screens/album/components/related-albums.tsx` before continuing (Tasks 11/12/14 fix all call sites).

- [ ] **Step 4: Commit**

```bash
git add components/album-link.tsx
git commit -m "refactor: retype AlbumLink against AlbumCardData"
```

---

## Task 9: Restructure `Hero` into a prop-driven component

Removes the local mode `useState` and the visible "Dev: xem ảnh/video" toggle button entirely. The parent (`HomeScreen`, wired in Task 16) now decides video-vs-images and passes the resolved data down — all existing Carousel/dot-indicator/motion code is preserved unchanged.

**Files:**
- Modify: `screens/home/components/hero.tsx`

**Interfaces:**
- Produces: `Hero({ heroData }: { heroData: HeroData })` where `HeroData = { video: string } | { images: string[] }` — consumed by Task 16's home page wiring via `HomeScreen`.

- [ ] **Step 1: Rewrite `screens/home/components/hero.tsx`**

Replace the entire file:

```tsx
"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel"

export type HeroData = { video: string } | { images: string[] }

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function Hero({ heroData }: { heroData: HeroData }) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    if (!carouselApi) return
    const onSelect = () => setActiveSlide(carouselApi.selectedScrollSnap())
    carouselApi.on("select", onSelect)
    return () => {
      carouselApi.off("select", onSelect)
    }
  }, [carouselApi])

  return (
    <section className="p-3 sm:p-5 md:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 1.02 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-900 sm:aspect-[16/9] md:aspect-[21/9]"
      >
        {"video" in heroData ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover [filter:grayscale(0.08)_contrast(1.04)]"
          >
            <source src={heroData.video} type="video/mp4" />
          </video>
        ) : (
          <Carousel
            opts={{ loop: true }}
            setApi={setCarouselApi}
            className="absolute inset-0 [&>[data-slot=carousel-content]]:h-full"
          >
            <CarouselContent className="ml-0 h-full">
              {heroData.images.map((src, i) => (
                <CarouselItem key={src} className="relative h-full pl-0">
                  <Image
                    src={src}
                    alt={`Hero slide ${i + 1}`}
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    className="object-cover [filter:grayscale(0.08)_contrast(1.04)]"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 border-white/30 bg-black/30 text-white hover:bg-black/50 hover:text-white" />
            <CarouselNext className="right-4 border-white/30 bg-black/30 text-white hover:bg-black/50 hover:text-white" />

            <div className="absolute inset-x-0 bottom-4 z-10 flex justify-center gap-2 sm:bottom-6">
              {heroData.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`Xem ảnh ${i + 1}`}
                  aria-current={i === activeSlide}
                  onClick={() => carouselApi?.scrollTo(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === activeSlide
                      ? "w-6 bg-white"
                      : "w-1.5 bg-white/40 hover:bg-white/70"
                  )}
                />
              ))}
            </div>
          </Carousel>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="absolute inset-x-6 bottom-6 flex flex-col items-end text-right sm:inset-x-10 sm:bottom-10 md:inset-x-14 md:bottom-14"
        >
          <motion.p
            variants={item}
            className="hidden font-serif text-[clamp(1.8rem,4.6vw,3.4rem)] leading-[1.15] text-[var(--on-image)] italic sm:block"
          >
            Kể chuyện tình
            <br />
            bằng điện ảnh.
          </motion.p>
          <motion.p
            variants={item}
            className="hidden mt-3 text-[0.8rem] font-medium tracking-[0.15em] text-[var(--on-image)]/75 uppercase sm:block"
          >
            Pre-wedding · Wedding · Video cưới — Việt Nam
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: fails — `screens/home/index.tsx` still renders `<Hero />` with no props. Expected; Task 11 fixes this. Confirm the only new error is in `screens/home/index.tsx`.

- [ ] **Step 3: Commit**

```bash
git add screens/home/components/hero.tsx
git commit -m "refactor: make Hero prop-driven, remove dev mode toggle"
```

---

## Task 10: Retype video display components against `VideoRow`

**Files:**
- Modify: `screens/home/components/video-grid.tsx`
- Modify: `screens/video-list/components/video-list-grid.tsx`
- Modify: `components/video-dialog-modal.tsx`

**Interfaces:**
- Consumes: `VideoRow` from `@/lib/supabase/types`; `videoThumbnail` from `@/lib/videos` (Task 3).
- Produces: `VideoGrid({ videos: VideoRow[] })`, `VideoListGrid({ videos: VideoRow[] })`, `VideoDialogModal({ video: VideoRow | null, onClose })` — consumed by Task 11 (home) and Task 13 (video list).

- [ ] **Step 1: Rewrite `components/video-dialog-modal.tsx`**

Replace the entire file:

```tsx
"use client"

import { X } from "lucide-react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog"
import { getYouTubeId } from "@/lib/utils"
import type { VideoRow } from "@/lib/supabase/types"

export function VideoDialogModal({
  video,
  onClose,
}: {
  video: VideoRow | null
  onClose: () => void
}) {
  const isOpen = video !== null

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogPortal>
        <DialogClose
          className="fixed top-5 right-5 z-[60] inline-flex border-0 bg-transparent p-0 text-white/70 outline-none transition-colors hover:text-white"
          aria-label="Đóng"
        >
          <X className="size-6" />
        </DialogClose>
      </DialogPortal>

      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] gap-0 border-0 bg-transparent p-0 ring-0 sm:max-w-4xl"
      >
        <DialogTitle className="sr-only">
          {video ? `${video.title} — ${video.location}` : "Video"}
        </DialogTitle>

        {video && (
          <>
            <div className="relative aspect-video w-full bg-neutral-900">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${getYouTubeId(video.youtube_url)}?autoplay=1`}
                title={`Video — ${video.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
            <p className="mt-4 text-center text-sm tracking-wide text-white/60">
              {video.title} · {video.location}
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Rewrite `screens/home/components/video-grid.tsx`**

Replace the entire file:

```tsx
"use client"

import { useState } from "react"

import { AlbumThumb } from "@/components/album-thumb"
import { VideoDialogModal } from "@/components/video-dialog-modal"
import { videoThumbnail } from "@/lib/videos"
import type { VideoRow } from "@/lib/supabase/types"

export function VideoGrid({ videos }: { videos: VideoRow[] }) {
  const [active, setActive] = useState<VideoRow | null>(null)

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 md:gap-6">
        {videos.map((video) => (
          <button
            key={video.id}
            type="button"
            onClick={() => setActive(video)}
            className="group block w-full text-left"
          >
            <AlbumThumb
              album={{
                title: video.title,
                location: video.location,
                coverImage: videoThumbnail(video.youtube_url),
              }}
              isVideo
              imageClassName="aspect-[16/10]"
            />
          </button>
        ))}
      </div>

      <VideoDialogModal video={active} onClose={() => setActive(null)} />
    </>
  )
}
```

- [ ] **Step 3: Rewrite `screens/video-list/components/video-list-grid.tsx`**

Replace the entire file:

```tsx
"use client"

import { useState } from "react"

import { AlbumThumb } from "@/components/album-thumb"
import { VideoDialogModal } from "@/components/video-dialog-modal"
import { videoThumbnail } from "@/lib/videos"
import type { VideoRow } from "@/lib/supabase/types"

export function VideoListGrid({ videos }: { videos: VideoRow[] }) {
  const [active, setActive] = useState<VideoRow | null>(null)

  return (
    <>
      <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8">
        {videos.map((video) => (
          <button
            key={video.id}
            type="button"
            onClick={() => setActive(video)}
            className="group block w-full text-left"
          >
            <AlbumThumb
              album={{
                title: video.title,
                location: video.location,
                coverImage: videoThumbnail(video.youtube_url),
              }}
              isVideo
              imageClassName="aspect-[3/4]"
            />
          </button>
        ))}
      </div>

      <VideoDialogModal video={active} onClose={() => setActive(null)} />
    </>
  )
}
```

- [ ] **Step 4: Verify typecheck**

Run: `pnpm typecheck`
Expected: fails — `screens/home/components/featured-albums.tsx` still passes `mockVideos.slice(0, 4)` (`VideoEntry[]`) into `VideoGrid`, and `screens/video-list/index.tsx` still passes `mockVideos` into `VideoListGrid`. Expected; Tasks 11 and 13 fix these. Confirm errors are limited to those two files.

- [ ] **Step 5: Commit**

```bash
git add screens/home/components/video-grid.tsx screens/video-list/components/video-list-grid.tsx components/video-dialog-modal.tsx
git commit -m "refactor: retype video display components against VideoRow"
```

---

## Task 11: Wire the home page's album/video display components to props

**Files:**
- Modify: `screens/home/components/album-film-row.tsx`
- Modify: `screens/home/components/featured-albums.tsx`
- Modify: `screens/home/components/recent-stories.tsx`
- Modify: `screens/home/index.tsx`

**Interfaces:**
- Consumes: `AlbumCardData` (Task 2), `CATEGORY_LABEL`/`CATEGORY_TITLE` (Task 2), `VIDEO_CATEGORY_LABEL`/`VIDEO_CATEGORY_TITLE` (Task 3), `VideoRow` (Task 5's data layer / `@/lib/supabase/types`), `HeroData` (Task 9), `ContactInfo` (Task 4).
- Produces: `HomeScreen({ heroData, preWeddingAlbums, weddingAlbums, videos, recentAlbums, contact })` — consumed by Task 16's `app/(site)/(home)/page.tsx`.

- [ ] **Step 1: Rewrite `screens/home/components/album-film-row.tsx`**

Replace the entire file:

```tsx
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { AlbumLink } from "@/components/album-link"
import { AlbumThumb } from "@/components/album-thumb"
import type { AlbumCardData } from "@/lib/albums"

export function AlbumFilmRow({ albums }: { albums: AlbumCardData[] }) {
  return (
    <>
      <Carousel opts={{ align: "start" }} className="w-full lg:hidden">
        <CarouselContent>
          {albums.map((album) => (
            <CarouselItem key={album.id} className="basis-[80%] sm:basis-[42%]">
              <AlbumLink album={album} className="group block">
                <AlbumThumb
                  album={album}
                  imageClassName="h-[320px] sm:h-[380px]"
                />
              </AlbumLink>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="hidden lg:grid lg:grid-cols-4 lg:gap-6">
        {albums.slice(0, 8).map((album) => (
          <AlbumLink key={album.id} album={album} className="group block">
            <AlbumThumb album={album} imageClassName="h-[480px]" />
          </AlbumLink>
        ))}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Rewrite `screens/home/components/featured-albums.tsx`**

Replace the entire file:

```tsx
"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import type { ReactNode } from "react"

import { AlbumFilmRow } from "@/screens/home/components/album-film-row"
import { VideoGrid } from "@/screens/home/components/video-grid"
import { CATEGORY_LABEL, CATEGORY_TITLE, type AlbumCardData } from "@/lib/albums"
import { VIDEO_CATEGORY_LABEL, VIDEO_CATEGORY_TITLE } from "@/lib/videos"
import type { VideoRow } from "@/lib/supabase/types"

export function FeaturedAlbums({
  preWeddingAlbums,
  weddingAlbums,
  videos,
}: {
  preWeddingAlbums: AlbumCardData[]
  weddingAlbums: AlbumCardData[]
  videos: VideoRow[]
}) {
  return (
    <>
      <Section
        id="pre-wedding"
        label={CATEGORY_LABEL.pre_wedding}
        title={CATEGORY_TITLE.pre_wedding}
        href="/pre-wedding"
      >
        <AlbumFilmRow albums={preWeddingAlbums} />
      </Section>

      <Section
        id="wedding"
        label={CATEGORY_LABEL.wedding}
        title={CATEGORY_TITLE.wedding}
        href="/wedding"
      >
        <AlbumFilmRow albums={weddingAlbums} />
      </Section>

      <Section
        id="video"
        label={VIDEO_CATEGORY_LABEL}
        title={VIDEO_CATEGORY_TITLE}
        href="/videos"
      >
        <VideoGrid videos={videos} />
      </Section>
    </>
  )
}

function Section({
  id,
  label,
  title,
  href,
  children,
}: {
  id: string
  label: string
  title: string
  href: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:pt-20 md:pb-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 border-b border-border pb-6 md:mb-10"
        >
          <p className="text-sm font-medium tracking-[0.2em] text-clay uppercase">
            {label}
          </p>
          <h2 className="mt-2 font-serif text-[clamp(2.1rem,4.4vw,3.1rem)] text-foreground">
            {title}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >
          {children}
        </motion.div>

        <div className="mt-9 flex justify-center md:mt-11">
          <Link
            href={href}
            className="group flex flex-col items-center gap-1.5 text-[0.72rem] font-medium tracking-[0.18em] text-foreground uppercase transition-colors hover:text-clay"
          >
            Xem tất cả
            <span className="h-px w-6 bg-current transition-all group-hover:w-9" />
          </Link>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Rewrite `screens/home/components/recent-stories.tsx`**

Replace the entire file:

```tsx
"use client"

import { motion } from "framer-motion"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { AlbumLink } from "@/components/album-link"
import { AlbumThumb } from "@/components/album-thumb"
import type { AlbumCardData } from "@/lib/albums"

export function RecentStories({ albums }: { albums: AlbumCardData[] }) {
  return (
    <section>
      <Carousel opts={{ align: "start" }} className="w-full">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8 flex flex-wrap items-baseline justify-between gap-4 py-10 md:mb-10 md:py-10"
          >
            <div>
              <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
                Câu chuyện gần đây
              </p>
              <h2 className="mt-2 font-serif text-[clamp(2rem,4.2vw,2.9rem)] text-foreground">
                Những khoảnh khắc nổi bật nhất nhất
              </h2>
            </div>

            <div className="flex gap-3">
              <CarouselPrevious className="static inset-auto! my-0! size-11 translate-y-0! border-border bg-transparent text-foreground transition-colors hover:border-clay hover:bg-transparent hover:text-clay disabled:opacity-30" />
              <CarouselNext className="static inset-auto! my-0! size-11 translate-y-0! border-border bg-transparent text-foreground transition-colors hover:border-clay hover:bg-transparent hover:text-clay disabled:opacity-30" />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
          className="px-6 pb-16 md:px-10 md:pb-20"
        >
          <CarouselContent>
            {albums.map((album) => (
              <CarouselItem
                key={album.id}
                className="basis-[85%] sm:basis-[34%] lg:basis-[22%]"
              >
                <AlbumLink album={album} className="group block">
                  <AlbumThumb album={album} imageClassName="aspect-[3/4]" />
                </AlbumLink>
              </CarouselItem>
            ))}
          </CarouselContent>
        </motion.div>
      </Carousel>
    </section>
  )
}
```

- [ ] **Step 4: Rewrite `screens/home/index.tsx`**

Replace the entire file:

```tsx
import { ContactSection } from "@/components/contact-section"
import { FeaturedAlbums } from "@/screens/home/components/featured-albums"
import { Hero, type HeroData } from "@/screens/home/components/hero"
import { PhilosophyStrip } from "@/screens/home/components/philosophy-strip"
import { RecentStories } from "@/screens/home/components/recent-stories"
import type { AlbumCardData } from "@/lib/albums"
import type { ContactInfo } from "@/lib/contact"
import type { VideoRow } from "@/lib/supabase/types"

export function HomeScreen({
  heroData,
  preWeddingAlbums,
  weddingAlbums,
  videos,
  recentAlbums,
  contact,
}: {
  heroData: HeroData
  preWeddingAlbums: AlbumCardData[]
  weddingAlbums: AlbumCardData[]
  videos: VideoRow[]
  recentAlbums: AlbumCardData[]
  contact: ContactInfo
}) {
  return (
    <main>
      <Hero heroData={heroData} />
      <PhilosophyStrip />
      <FeaturedAlbums
        preWeddingAlbums={preWeddingAlbums}
        weddingAlbums={weddingAlbums}
        videos={videos}
      />
      <RecentStories albums={recentAlbums} />
      <ContactSection contact={contact} />
    </main>
  )
}
```

- [ ] **Step 5: Verify typecheck**

Run: `pnpm typecheck`
Expected: fails only on `app/(site)/(home)/page.tsx` (still renders `<HomeScreen />` with no props) and on `components/contact-section.tsx` (not yet retyped — Task 15). Confirm no other new errors.

- [ ] **Step 6: Commit**

```bash
git add screens/home
git commit -m "refactor: make home page components prop-driven"
```

---

## Task 12: Wire the album list screen to props

**Files:**
- Modify: `screens/album-list/components/album-grid.tsx`
- Modify: `screens/album-list/components/wedding-grid.tsx`
- Modify: `screens/album-list/index.tsx`

**Interfaces:**
- Consumes: `AlbumCardData`, `CATEGORY_LABEL`, `CATEGORY_TITLE`, `AlbumCategory` (Task 2); `ContactInfo` (Task 4).
- Produces: `AlbumListScreen({ category, albums, contact })` — consumed by Task 16's `pre-wedding/page.tsx` and `wedding/page.tsx`.

- [ ] **Step 1: Rewrite `screens/album-list/components/album-grid.tsx`**

Replace the entire file:

```tsx
import { AlbumLink } from "@/components/album-link"
import { AlbumThumb } from "@/components/album-thumb"
import type { AlbumCardData } from "@/lib/albums"

export function AlbumGrid({ albums }: { albums: AlbumCardData[] }) {
  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8">
      {albums.map((album) => (
        <AlbumLink key={album.id} album={album} className="group block">
          <AlbumThumb album={album} imageClassName="aspect-[3/4]" />
        </AlbumLink>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `screens/album-list/components/wedding-grid.tsx`**

Replace the entire file:

```tsx
import { AlbumLink } from "@/components/album-link"
import { AlbumThumb } from "@/components/album-thumb"
import type { AlbumCardData } from "@/lib/albums"

export function WeddingGrid({ albums }: { albums: AlbumCardData[] }) {
  const [featured, ...rest] = albums

  if (!featured) return null

  return (
    <div className="space-y-12 md:space-y-16">
      <div>
        <p className="mb-4 text-[0.7rem] font-medium tracking-[0.16em] text-clay uppercase">
          Album mới nhất
        </p>
        <AlbumLink album={featured} className="group block">
          <AlbumThumb
            album={featured}
            imageClassName="aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9]"
          />
        </AlbumLink>
      </div>

      {rest.length > 0 && (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 md:gap-x-8">
          {rest.map((album) => (
            <AlbumLink key={album.id} album={album} className="group block">
              <AlbumThumb album={album} imageClassName="aspect-[3/4]" />
            </AlbumLink>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Rewrite `screens/album-list/index.tsx`**

Replace the entire file:

```tsx
"use client"

import { motion } from "framer-motion"
import Link from "next/link"

import { ContactSection } from "@/components/contact-section"
import { AlbumGrid } from "@/screens/album-list/components/album-grid"
import { WeddingGrid } from "@/screens/album-list/components/wedding-grid"
import { CATEGORY_LABEL, CATEGORY_TITLE, type AlbumCardData, type AlbumCategory } from "@/lib/albums"
import type { ContactInfo } from "@/lib/contact"

export function AlbumListScreen({
  category,
  albums,
  contact,
}: {
  category: AlbumCategory
  albums: AlbumCardData[]
  contact: ContactInfo
}) {
  return (
    <main>
      <section className="pt-10 pb-10 md:pt-12 md:pb-14">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Link
              href="/"
              className="text-[0.72rem] font-medium tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-clay"
            >
              ← Trang chủ
            </Link>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
              <p className="text-sm font-medium tracking-[0.2em] text-clay uppercase">
                {CATEGORY_LABEL[category]}
              </p>
            </div>
            <h1 className="mt-2 font-serif text-[clamp(2.4rem,6vw,4rem)] text-foreground">
              {CATEGORY_TITLE[category]}
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          {category === "wedding" ? (
            <WeddingGrid albums={albums} />
          ) : (
            <AlbumGrid albums={albums} />
          )}
        </div>
      </section>

      <ContactSection contact={contact} />
    </main>
  )
}
```

- [ ] **Step 4: Verify typecheck**

Run: `pnpm typecheck`
Expected: fails only on `app/(site)/pre-wedding/page.tsx` / `app/(site)/wedding/page.tsx` (Task 16) and `components/contact-section.tsx` (Task 15). Confirm no other new errors.

- [ ] **Step 5: Commit**

```bash
git add screens/album-list
git commit -m "refactor: make album list screen prop-driven"
```

---

## Task 13: Wire the video list screen to props

**Files:**
- Modify: `screens/video-list/index.tsx`

**Interfaces:**
- Consumes: `VIDEO_CATEGORY_LABEL`, `VIDEO_CATEGORY_TITLE` (Task 3); `VideoRow` (Task 10); `ContactInfo` (Task 4).
- Produces: `VideoListScreen({ videos, contact })` — consumed by Task 16's `app/(site)/videos/page.tsx`.

- [ ] **Step 1: Rewrite `screens/video-list/index.tsx`**

Replace the entire file:

```tsx
"use client"

import { motion } from "framer-motion"
import Link from "next/link"

import { ContactSection } from "@/components/contact-section"
import { VideoListGrid } from "@/screens/video-list/components/video-list-grid"
import { VIDEO_CATEGORY_LABEL, VIDEO_CATEGORY_TITLE } from "@/lib/videos"
import type { ContactInfo } from "@/lib/contact"
import type { VideoRow } from "@/lib/supabase/types"

export function VideoListScreen({
  videos,
  contact,
}: {
  videos: VideoRow[]
  contact: ContactInfo
}) {
  return (
    <main>
      <section className="pt-10 pb-10 md:pt-12 md:pb-14">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Link
              href="/"
              className="text-[0.72rem] font-medium tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-clay"
            >
              ← Trang chủ
            </Link>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
              <p className="text-sm font-medium tracking-[0.2em] text-clay uppercase">
                {VIDEO_CATEGORY_LABEL}
              </p>
            </div>
            <h1 className="mt-2 font-serif text-[clamp(2.4rem,6vw,4rem)] text-foreground">
              {VIDEO_CATEGORY_TITLE}
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <VideoListGrid videos={videos} />
        </div>
      </section>

      <ContactSection contact={contact} />
    </main>
  )
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: fails only on `app/(site)/videos/page.tsx` (Task 16) and `components/contact-section.tsx` (Task 15). Confirm no other new errors.

- [ ] **Step 3: Commit**

```bash
git add screens/video-list/index.tsx
git commit -m "refactor: make video list screen prop-driven"
```

---

## Task 14: Wire the album detail screen to props

**Files:**
- Modify: `screens/album/components/album-title.tsx`
- Modify: `screens/album/components/album-credits.tsx`
- Modify: `screens/album/components/related-albums.tsx`
- Modify: `screens/album/index.tsx`

**Interfaces:**
- Consumes: `AlbumDetailData`, `AlbumCardData`, `AlbumCredit`, `formatMonthYearVi`, `buildAlbumCredits` (Task 2); `ContactInfo` (Task 4).
- Produces: `AlbumScreen({ album, related, contact })` — consumed by Task 16's `pre-wedding/[slug]/page.tsx` and `wedding/[slug]/page.tsx`.

- [ ] **Step 1: Rewrite `screens/album/components/album-title.tsx`**

Replace the entire file:

```tsx
"use client"

import { motion } from "framer-motion"
import Link from "next/link"

import { CATEGORY_LABEL, formatMonthYearVi, type AlbumDetailData } from "@/lib/albums"

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function AlbumTitle({
  album,
  listHref,
}: {
  album: AlbumDetailData
  listHref: string
}) {
  return (
    <section className="pt-8 pb-14 md:pt-12 md:pb-16">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item}>
            <Link
              href={listHref}
              className="text-[0.7rem] font-medium tracking-[0.2em] text-muted-foreground uppercase transition-colors hover:text-clay"
            >
              ← {CATEGORY_LABEL[album.category]}
            </Link>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-5 font-serif text-[clamp(2.4rem,5.6vw,4rem)] leading-[1.05] text-foreground"
          >
            {album.title}
          </motion.h1>

          <motion.div
            variants={item}
            className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 md:mt-6"
          >
            <span className="font-serif text-lg text-clay italic md:text-xl">
              {album.location}
            </span>
            <span aria-hidden className="h-3 w-px bg-border" />
            <span className="text-[0.72rem] font-medium tracking-[0.18em] text-muted-foreground uppercase">
              {album.eventDate ? `${formatMonthYearVi(album.eventDate)} · ` : ""}
              {album.photos.length} ảnh
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Update the `AlbumCredit` import in `screens/album/components/album-credits.tsx`**

Change:

```ts
import type { AlbumCredit } from "@/lib/mock-albums"
```

to:

```ts
import type { AlbumCredit } from "@/lib/albums"
```

Leave the rest of the file unchanged.

- [ ] **Step 3: Rewrite `screens/album/components/related-albums.tsx`**

Replace the entire file:

```tsx
import { AlbumLink } from "@/components/album-link"
import { AlbumThumb } from "@/components/album-thumb"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import type { AlbumCardData } from "@/lib/albums"

export function RelatedAlbums({ albums }: { albums: AlbumCardData[] }) {
  if (albums.length === 0) return null

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:pt-20 md:pb-10">
        <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Có thể bạn cũng thích
        </p>
        <Carousel opts={{ align: "start" }} className="mt-8">
          <CarouselContent className="-ml-4 md:-ml-6">
            {albums.map((album) => (
              <CarouselItem
                key={album.id}
                className="basis-[68%] pl-4 sm:basis-1/2 md:pl-6 lg:basis-1/4"
              >
                <AlbumLink album={album} className="group block">
                  <AlbumThumb album={album} imageClassName="aspect-[3/4]" />
                </AlbumLink>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Rewrite `screens/album/index.tsx`**

Replace the entire file:

```tsx
import { ContactSection } from "@/components/contact-section"
import { buildAlbumCredits, type AlbumCardData, type AlbumDetailData } from "@/lib/albums"
import type { ContactInfo } from "@/lib/contact"
import { AlbumCredits } from "@/screens/album/components/album-credits"
import { AlbumTitle } from "@/screens/album/components/album-title"
import { HighlightVideo } from "@/screens/album/components/highlight-video"
import { PhotoLightbox } from "@/screens/album/components/photo-lightbox"
import { RelatedAlbums } from "@/screens/album/components/related-albums"

export function AlbumScreen({
  album,
  related,
  contact,
}: {
  album: AlbumDetailData
  related: AlbumCardData[]
  contact: ContactInfo
}) {
  const listHref = album.category === "pre_wedding" ? "/pre-wedding" : "/wedding"
  const credits = buildAlbumCredits(album.location)

  return (
    <main>
      <AlbumTitle album={album} listHref={listHref} />

      {album.highlightVideoUrl && (
        <section className="pb-16 md:pb-20">
          <div className="mx-auto max-w-[1440px] px-6 md:px-10">
            <HighlightVideo url={album.highlightVideoUrl} title={album.title} />
          </div>
        </section>
      )}

      <section className="pb-20 md:pb-28">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <PhotoLightbox photos={album.photos} title={album.title} />
        </div>
      </section>

      <AlbumCredits credits={credits} />

      <RelatedAlbums albums={related} />

      <ContactSection contact={contact} />
    </main>
  )
}
```

- [ ] **Step 5: Verify typecheck**

Run: `pnpm typecheck`
Expected: fails only on `app/(site)/pre-wedding/[slug]/page.tsx` / `app/(site)/wedding/[slug]/page.tsx` (Task 16) and `components/contact-section.tsx` (Task 15). Confirm no other new errors.

- [ ] **Step 6: Commit**

```bash
git add screens/album
git commit -m "refactor: make album detail screen prop-driven"
```

---

## Task 15: Wire contact-facing components to `ContactInfo`

**Files:**
- Modify: `components/contact-section.tsx`
- Modify: `components/floating-social.tsx`
- Modify: `screens/contact/index.tsx`

**Interfaces:**
- Consumes: `ContactInfo` (Task 4), `SocialUrls`/`buildSocialLinks` (Task 4).
- Produces: `ContactSection({ contact })`, `FloatingSocial({ contact })`, `ContactScreen({ contact })` — consumed throughout Task 16.

- [ ] **Step 1: Rewrite `components/contact-section.tsx`**

Replace the entire file:

```tsx
"use client"

import { motion } from "framer-motion"

import { buildSocialLinks } from "@/lib/socials"
import type { ContactInfo } from "@/lib/contact"

const socialContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.1 },
  },
}

const socialItem = {
  hidden: { opacity: 0, y: 14, scale: 0.94 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function ContactSection({ contact }: { contact: ContactInfo }) {
  const socialLinks = buildSocialLinks(contact)

  return (
    <section
      id="contact"
      className="scroll-mt-20 bg-neutral-950 text-[var(--on-image)]"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6 }}
          className="text-[0.75rem] font-medium tracking-[0.25em] text-clay uppercase"
        >
          Bắt đầu
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className="mt-5 font-serif text-[clamp(2rem,5vw,3.2rem)] leading-[1.15] italic"
        >
          Câu chuyện của bạn bắt đầu từ đây.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-10 inline-flex h-11 items-center rounded-full bg-[var(--on-image)] px-8 text-sm font-medium tracking-wide text-neutral-950 transition-transform hover:-translate-y-0.5"
        >
          Liên hệ Remy&rsquo;s
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 text-sm text-[var(--on-image)]/60"
        >
          {contact.email}
        </motion.p>

        <motion.div
          variants={socialContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10%" }}
          className="mt-12 flex flex-wrap justify-center gap-3"
        >
          {socialLinks.map(({ label, href, icon }) => (
            <motion.a
              key={label}
              variants={socialItem}
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-2.5 rounded-full border border-[var(--on-image)]/20 px-5 py-2.5 text-sm text-[var(--on-image)]/80 transition-colors duration-300 hover:border-[var(--on-image)]/45 hover:text-[var(--on-image)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={icon} alt="" className="size-4" />
              {label}
            </motion.a>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Rewrite `components/floating-social.tsx`**

Replace the entire file:

```tsx
"use client"

import { motion } from "framer-motion"

import { buildSocialLinks, type SocialUrls } from "@/lib/socials"

export function FloatingSocial({ contact }: { contact: SocialUrls }) {
  const socialLinks = buildSocialLinks(contact)

  return (
    <div className="fixed right-6 bottom-8 z-40 flex flex-col gap-3 sm:right-10 sm:bottom-16">
      {socialLinks.map(({ label, href, icon }, index) => (
        <motion.a
          key={label}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          animate={{ rotate: [0, -10, 10, -8, 8, -4, 4, 0] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            repeatDelay: 2.6,
            delay: index * 0.25,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="flex size-11 items-center justify-center rounded-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={icon}
            alt=""
            className={label === "Instagram" ? "size-9" : "size-11"}
          />
        </motion.a>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Rewrite `screens/contact/index.tsx`**

Replace the entire file:

```tsx
"use client"

import { motion } from "framer-motion"
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react"
import Link from "next/link"

import { buildSocialLinks } from "@/lib/socials"
import type { ContactInfo } from "@/lib/contact"

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const socialContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.25 },
  },
}

const socialItem = {
  hidden: { opacity: 0, y: 12, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
}

export function ContactScreen({ contact }: { contact: ContactInfo }) {
  const infoItems = [
    { icon: MapPin, label: "Địa chỉ", value: contact.address },
    { icon: Mail, label: "Email", value: contact.email },
    { icon: Phone, label: "Điện thoại", value: contact.phone },
  ]
  const socialLinks = buildSocialLinks(contact)

  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
    contact.address
  )}&output=embed`

  const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    contact.address
  )}`

  return (
    <main>
      <section className="relative bg-grain pt-10 pb-8 md:pt-12 md:pb-12">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Link
              href="/"
              className="text-[0.72rem] font-medium tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-clay"
            >
              ← Trang chủ
            </Link>

            <p className="mt-8 text-sm font-medium tracking-[0.2em] text-clay uppercase">
              Liên hệ
            </p>

            <motion.span
              aria-hidden
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="mt-4 block font-serif text-6xl text-clay/60 select-none"
            >
              &ldquo;
            </motion.span>

            <h1 className="-mt-3 max-w-2xl font-serif text-[clamp(2rem,4.6vw,3.2rem)] leading-[1.3] text-foreground">
              Ghé thăm studio, gọi điện, hay nhắn tin —{" "}
              <span className="italic">Remy&rsquo;s luôn sẵn sàng lắng nghe</span>.
            </h1>

            <div className="mt-8 h-px w-10 bg-border" />
          </motion.div>
        </div>
      </section>

      <section className="pb-20 md:pb-28">
        <div className="mx-auto grid max-w-[1440px] gap-x-16 gap-y-14 px-6 md:grid-cols-12 md:px-10">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10%" }}
            variants={fadeUp}
            className="md:col-span-5"
          >
            <div>
              {infoItems.map(({ icon: Icon, label, value }, i) => (
                <div
                  key={label}
                  className={`flex items-start gap-5 border-border py-6 ${
                    i === 0 ? "pt-0" : ""
                  } ${i < infoItems.length - 1 ? "border-b" : ""}`}
                >
                  <Icon
                    strokeWidth={1.5}
                    className="mt-1 size-4 shrink-0 text-clay"
                  />
                  <div>
                    <p className="text-[0.68rem] font-medium tracking-[0.22em] text-muted-foreground uppercase">
                      {label}
                    </p>
                    <p className="mt-2 font-serif text-xl text-foreground">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <p className="text-[0.68rem] font-medium tracking-[0.22em] text-muted-foreground uppercase">
                Theo dõi
              </p>
              <motion.div
                variants={socialContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-10%" }}
                className="mt-4 flex gap-3"
              >
                {socialLinks.map(({ label, href, icon }) => (
                  <motion.a
                    key={label}
                    variants={socialItem}
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 380, damping: 20 }}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2.5 rounded-full border border-border py-2.5 pr-5 pl-3 text-sm text-foreground/80 transition-colors duration-300 hover:border-clay/50 hover:text-clay"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={icon}
                      alt=""
                      className={label === "Instagram" ? "size-4" : "size-5"}
                    />
                    {label}
                  </motion.a>
                ))}
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10%" }}
            variants={fadeUp}
            transition={{ delay: 0.12 }}
            className="md:col-span-7"
          >
            <div className="relative overflow-hidden border border-border bg-neutral-900">
              <div className="relative aspect-[4/5] sm:aspect-[16/10] md:aspect-[16/9]">
                <iframe
                  src={mapSrc}
                  title="Bản đồ studio Remy's"
                  className="absolute inset-0 h-full w-full [filter:grayscale(0.5)_contrast(1.1)_brightness(0.97)]"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
            </div>

            <a
              href={mapLink}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-[0.7rem] font-medium tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-clay"
            >
              Xem trên Google Maps
              <ArrowUpRight className="size-3.5" />
            </a>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 4: Verify typecheck**

Run: `pnpm typecheck`
Expected: fails only on the seven `app/(site)/**` route files that still render these components without a `contact`/`heroData`/`albums`/`videos` prop (fixed in Task 16).

- [ ] **Step 5: Commit**

```bash
git add components/contact-section.tsx components/floating-social.tsx screens/contact/index.tsx
git commit -m "refactor: make contact-facing components ContactInfo-driven"
```

---

## Task 16: Wire every `app/(site)` route to real server-side data

**Files:**
- Modify: `app/(site)/layout.tsx`
- Modify: `app/(site)/(home)/page.tsx`
- Modify: `app/(site)/pre-wedding/page.tsx`
- Modify: `app/(site)/pre-wedding/[slug]/page.tsx`
- Modify: `app/(site)/wedding/page.tsx`
- Modify: `app/(site)/wedding/[slug]/page.tsx`
- Modify: `app/(site)/videos/page.tsx`
- Modify: `app/(site)/contact/page.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1–15 — `getSiteSettings`, `listHeroImages`, `getFeaturedAlbums`, `getPublishedVideos`, `getRecentPublishedAlbums`, `getPublishedAlbumsByCategory`, `getPublishedAlbumBySlug` (data layer); `resolveContactInfo`, `toAlbumCardData`, `toAlbumDetailData`, `formatMonthYearVi`, `publicImageUrl`; every retyped `screens/*` component.

- [ ] **Step 1: Rewrite `app/(site)/layout.tsx`**

Replace the entire file:

```tsx
import { FloatingSocial } from "@/components/floating-social"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { resolveContactInfo } from "@/lib/contact"
import { getSiteSettings } from "@/lib/data/settings"

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getSiteSettings()
  const contact = resolveContactInfo(settings)

  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
      <FloatingSocial contact={contact} />
    </>
  )
}
```

- [ ] **Step 2: Rewrite `app/(site)/(home)/page.tsx`**

Replace the entire file:

```tsx
import { HomeScreen } from "@/screens/home"
import type { HeroData } from "@/screens/home/components/hero"
import { toAlbumCardData } from "@/lib/albums"
import { resolveContactInfo } from "@/lib/contact"
import { getFeaturedAlbums, getRecentPublishedAlbums } from "@/lib/data/albums"
import { listHeroImages } from "@/lib/data/hero-images"
import { getSiteSettings } from "@/lib/data/settings"
import { getPublishedVideos } from "@/lib/data/videos"
import { publicImageUrl } from "@/lib/r2-url"

export default async function Page() {
  const [settings, heroImages, featuredAlbums, videos, recentAlbums] = await Promise.all([
    getSiteSettings(),
    listHeroImages(),
    getFeaturedAlbums(),
    getPublishedVideos(),
    getRecentPublishedAlbums(8),
  ])

  const heroData: HeroData =
    settings.hero_background_mode === "images" && heroImages.length > 0
      ? { images: heroImages.map((image) => publicImageUrl(image.image_key)) }
      : { video: settings.hero_video_url || "/Webcover.mp4" }

  const preWeddingAlbums = featuredAlbums
    .filter((album) => album.category === "pre_wedding")
    .slice(0, 4)
    .map(toAlbumCardData)

  const weddingAlbums = featuredAlbums
    .filter((album) => album.category === "wedding")
    .slice(0, 8)
    .map(toAlbumCardData)

  return (
    <HomeScreen
      heroData={heroData}
      preWeddingAlbums={preWeddingAlbums}
      weddingAlbums={weddingAlbums}
      videos={videos.slice(0, 4)}
      recentAlbums={recentAlbums.map(toAlbumCardData)}
      contact={resolveContactInfo(settings)}
    />
  )
}
```

- [ ] **Step 3: Rewrite `app/(site)/pre-wedding/page.tsx`**

Replace the entire file:

```tsx
import type { Metadata } from "next"

import { AlbumListScreen } from "@/screens/album-list"
import { toAlbumCardData } from "@/lib/albums"
import { resolveContactInfo } from "@/lib/contact"
import { getPublishedAlbumsByCategory } from "@/lib/data/albums"
import { getSiteSettings } from "@/lib/data/settings"

export const metadata: Metadata = {
  title: "Pre-wedding — Remy's",
  description:
    "Trước ngày cưới, hai người được là chính mình — không kịch bản, không gượng ép.",
}

export default async function Page() {
  const [albums, settings] = await Promise.all([
    getPublishedAlbumsByCategory("pre_wedding"),
    getSiteSettings(),
  ])

  return (
    <AlbumListScreen
      category="pre_wedding"
      albums={albums.map(toAlbumCardData)}
      contact={resolveContactInfo(settings)}
    />
  )
}
```

- [ ] **Step 4: Rewrite `app/(site)/wedding/page.tsx`**

Replace the entire file:

```tsx
import type { Metadata } from "next"

import { AlbumListScreen } from "@/screens/album-list"
import { toAlbumCardData } from "@/lib/albums"
import { resolveContactInfo } from "@/lib/contact"
import { getPublishedAlbumsByCategory } from "@/lib/data/albums"
import { getSiteSettings } from "@/lib/data/settings"

export const metadata: Metadata = {
  title: "Wedding — Remy's",
  description:
    "Toàn cảnh ngày cưới, từ lễ gia tiên trang nghiêm đến tiệc mừng rộn tiếng cười.",
}

export default async function Page() {
  const [albums, settings] = await Promise.all([
    getPublishedAlbumsByCategory("wedding"),
    getSiteSettings(),
  ])

  return (
    <AlbumListScreen
      category="wedding"
      albums={albums.map(toAlbumCardData)}
      contact={resolveContactInfo(settings)}
    />
  )
}
```

- [ ] **Step 5: Rewrite `app/(site)/pre-wedding/[slug]/page.tsx`**

Replace the entire file:

```tsx
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AlbumScreen } from "@/screens/album"
import { formatMonthYearVi, toAlbumCardData, toAlbumDetailData } from "@/lib/albums"
import { resolveContactInfo } from "@/lib/contact"
import { getPublishedAlbumBySlug, getPublishedAlbumsByCategory } from "@/lib/data/albums"
import { getSiteSettings } from "@/lib/data/settings"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const album = await getPublishedAlbumBySlug(slug)

  if (!album || album.category !== "pre_wedding") return {}

  return {
    title: `${album.title} — Remy's`,
    description: `${album.location ?? ""}${
      album.event_date ? ` · ${formatMonthYearVi(album.event_date)}` : ""
    }`,
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const album = await getPublishedAlbumBySlug(slug)

  if (!album || album.category !== "pre_wedding") notFound()

  const [categoryAlbums, settings] = await Promise.all([
    getPublishedAlbumsByCategory(album.category),
    getSiteSettings(),
  ])

  const related = categoryAlbums
    .filter((a) => a.id !== album.id)
    .slice(0, 4)
    .map(toAlbumCardData)

  return (
    <AlbumScreen
      album={toAlbumDetailData(album)}
      related={related}
      contact={resolveContactInfo(settings)}
    />
  )
}
```

- [ ] **Step 6: Rewrite `app/(site)/wedding/[slug]/page.tsx`**

Replace the entire file:

```tsx
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AlbumScreen } from "@/screens/album"
import { formatMonthYearVi, toAlbumCardData, toAlbumDetailData } from "@/lib/albums"
import { resolveContactInfo } from "@/lib/contact"
import { getPublishedAlbumBySlug, getPublishedAlbumsByCategory } from "@/lib/data/albums"
import { getSiteSettings } from "@/lib/data/settings"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const album = await getPublishedAlbumBySlug(slug)

  if (!album || album.category === "pre_wedding") return {}

  return {
    title: `${album.title} — Remy's`,
    description: `${album.location ?? ""}${
      album.event_date ? ` · ${formatMonthYearVi(album.event_date)}` : ""
    }`,
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const album = await getPublishedAlbumBySlug(slug)

  if (!album || album.category === "pre_wedding") notFound()

  const [categoryAlbums, settings] = await Promise.all([
    getPublishedAlbumsByCategory(album.category),
    getSiteSettings(),
  ])

  const related = categoryAlbums
    .filter((a) => a.id !== album.id)
    .slice(0, 4)
    .map(toAlbumCardData)

  return (
    <AlbumScreen
      album={toAlbumDetailData(album)}
      related={related}
      contact={resolveContactInfo(settings)}
    />
  )
}
```

- [ ] **Step 7: Rewrite `app/(site)/videos/page.tsx`**

Replace the entire file:

```tsx
import type { Metadata } from "next"

import { VideoListScreen } from "@/screens/video-list"
import { resolveContactInfo } from "@/lib/contact"
import { getSiteSettings } from "@/lib/data/settings"
import { getPublishedVideos } from "@/lib/data/videos"

export const metadata: Metadata = {
  title: "Video cưới — Remy's",
  description: "Cảm xúc, dựng thành chuyển động — toàn bộ video cưới của Remy's.",
}

export default async function Page() {
  const [videos, settings] = await Promise.all([
    getPublishedVideos(),
    getSiteSettings(),
  ])

  return <VideoListScreen videos={videos} contact={resolveContactInfo(settings)} />
}
```

- [ ] **Step 8: Rewrite `app/(site)/contact/page.tsx`**

Replace the entire file:

```tsx
import type { Metadata } from "next"

import { ContactScreen } from "@/screens/contact"
import { resolveContactInfo } from "@/lib/contact"
import { getSiteSettings } from "@/lib/data/settings"

export const metadata: Metadata = {
  title: "Liên hệ — Remy's",
  description: "Địa chỉ studio, bản đồ và thông tin liên hệ của Remy's.",
}

export default async function Page() {
  const settings = await getSiteSettings()
  return <ContactScreen contact={resolveContactInfo(settings)} />
}
```

- [ ] **Step 9: Verify typecheck, lint, and tests**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all pass. If any error remains, it should only be inside `lib/mock-albums.ts`/`lib/mock-videos.ts` themselves or genuinely leftover call sites — track those down and fix them before moving on (do not delete the mock files yet — that's Task 17).

- [ ] **Step 10: Live verification with the user**

Start the dev server if not already running. Ask the user to walk through, in the browser:
- Home page (`/`): hero (video or images depending on `hero_background_mode`), featured pre-wedding/wedding rows, video row, "Câu chuyện gần đây" carousel, contact CTA email.
- `/pre-wedding` and `/wedding`: album grids.
- An album detail page: title/date/location, highlight video (if set), photo lightbox, credits (confirm "Địa điểm" reflects the real album location), related albums.
- `/videos`: video grid + dialog playback.
- `/contact`: address/email/phone/social links, embedded map.
- Floating social buttons and footer on every page.

Fix any issues found before proceeding.

- [ ] **Step 11: Commit**

```bash
git add "app/(site)"
git commit -m "feat: wire public site routes to real Supabase data"
```

---

## Task 17: Delete mock data files and clean up

**Files:**
- Delete: `lib/mock-albums.ts`
- Delete: `lib/mock-videos.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Grep-verify no remaining references**

Run:

```bash
grep -rn "mock-albums\|mock-videos" --include="*.ts" --include="*.tsx" . | grep -v node_modules
```

Expected: no output (or only matches inside the two files about to be deleted). If any other file still references them, fix that file before continuing.

- [ ] **Step 2: Delete the mock files**

```bash
rm lib/mock-albums.ts lib/mock-videos.ts
```

- [ ] **Step 3: Remove the now-unused `picsum.photos` remote pattern from `next.config.ts`**

Change:

```ts
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
      },
    ],
```

to:

```ts
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "pub-*.r2.dev",
      },
    ],
```

- [ ] **Step 4: Verify typecheck, lint, and tests**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add -A lib/mock-albums.ts lib/mock-videos.ts next.config.ts
git commit -m "chore: remove mock data files, now fully replaced by real data"
```

---

## Task 18: Final full verification

- [ ] **Step 1: Run the full check suite**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all pass, zero errors/warnings.

- [ ] **Step 2: Final live walkthrough with the user**

Ask the user to do one more complete pass through every public route (home, pre-wedding list + detail, wedding list + detail, videos, contact) plus a quick admin sanity check (`/admin/albums`, `/admin/videos`, `/admin/settings` including the new phone field) to confirm nothing regressed. Fix anything they flag.

- [ ] **Step 3: Report completion**

Summarize what changed (public site now reads live Supabase data; mock files removed; `site_settings.phone` added end-to-end) and hand off to the finishing-a-development-branch skill.
