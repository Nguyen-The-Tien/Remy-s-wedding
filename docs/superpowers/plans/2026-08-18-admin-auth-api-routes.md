# Admin Auth & API Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the admin panel's mock `localStorage` auth with real Supabase Auth
served through `httpOnly`-cookie server routes, and add the full `/api/*` route surface
(uploads, albums, photos, videos, hero images, settings) that the admin UI will call
in the next plan via react-query. No admin screen's visual layout changes — only how it
authenticates and where the "save" button's data goes next.

**Architecture:** `proxy.ts` is the single authorization checkpoint for both admin pages
and all `/api/*` routes — route handlers trust that gate and call `createAdminClient()`
(from Plan 1) directly, with no per-route session re-checking. The one exception is
authentication itself: login, logout, and change-password are dedicated Route Handlers
under `/api/auth/*` that use a server-side Supabase client with `httpOnly` cookies —
this is the only way to set a cookie client-side JavaScript can never read, which is
what makes the session secure against XSS. Every request body (auth and data alike) is
validated by a zod schema before it reaches `lib/data/*` (built in Plan 1). This plan
ships zero UI/data-fetching changes beyond the three auth screens — the admin data
screens (albums, videos, settings) still run on `lib/admin/mock-store.tsx` until the
next plan (Admin UI Wiring) swaps it for real react-query calls against these routes.

**Tech Stack:** Next.js 16 App Router Route Handlers, `@supabase/ssr` server client with
`httpOnly` cookies, zod (already a dependency), Vitest (already set up in Plan 1).
`axios` and `@tanstack/react-query` are installed in this plan (Task 1) because the next
plan (Admin UI Wiring) will use them for every non-auth API call — each admin feature
gets its own `queries/` folder of react-query hooks, so the data and its loading/error
state are visible client-side for you to inspect while testing. Auth is the one
exception, for the `httpOnly` reason above.

**Spec:** `docs/superpowers/specs/2026-08-16-backend-supabase-r2-design.md` (section 5
upload flow, section 6 delete flow, section 11 API route surface — adapted below for the
`videos`/`hero_images` schema split from Plan 1, which the original spec predates, and
for the SSR/`httpOnly` auth routes, which the spec doesn't cover).

**Prior plan:** `docs/superpowers/plans/2026-08-16-data-storage-foundation.md` (Plan 1 —
already merged to `main`). This plan consumes `lib/data/*`, `lib/r2.ts`,
`lib/supabase/{types,anon,admin}.ts`, `proxy.ts`, `supabase/schema.sql` from it — read
those files, not this plan, for their exact signatures.

## Global Constraints

- Every `/api/*` route handler except `/api/auth/login` is gated exclusively by
  `proxy.ts` (Task 2) — route handlers never call `createServerClient`/re-check the
  session themselves. If a handler is reached at all, the request already carries a
  valid admin session.
- Route handlers never query Postgres or R2 directly — they call the `lib/data/*` /
  `lib/r2.ts` functions from Plan 1, same constraint that plan already established.
- Every request body is validated by a zod schema from `lib/api/schemas.ts` via the
  `parseJsonBody` helper (Task 5) before it reaches the data layer — invalid input
  returns `400` and never touches `lib/data/*`.
- `lib/admin/auth.ts`'s mock functions (`checkCredentials`, `setSession`,
  `clearSession`, `hasSession`, `DEMO_CREDENTIALS`) are fully replaced in Task 1, not
  layered on top of.
- `@supabase/ssr`'s `DEFAULT_COOKIE_OPTIONS` ships `httpOnly: false` (confirmed by
  reading `node_modules/.pnpm/@supabase+ssr*/node_modules/@supabase/ssr/dist/main/utils/constants.js`
  in this repo) — every `createServerClient` call in this plan (Task 1's
  `lib/supabase/server.ts`, and Task 2's `proxy.ts`) must explicitly pass
  `cookieOptions: { httpOnly: true }`, or the session cookie is readable by client JS.
- No browser-side Supabase client exists anywhere in this plan — auth only ever happens
  through the `/api/auth/*` Route Handlers, which is what makes the `httpOnly` cookie
  possible in the first place.
- Next.js 16 Route Handler `params` are a `Promise` — always `await params` (confirmed
  against `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`
  in this repo). `cookies()` from `next/headers` is also async, and `.set()` on it is
  only valid inside a Route Handler or Server Action (confirmed against
  `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md`).

---

## Task 1: Supabase Auth — console admin user + `httpOnly` SSR auth routes + client deps

**Files:**
- Create: `lib/supabase/server.ts`
- Create: `app/api/auth/login/route.ts`
- Create: `app/api/auth/logout/route.ts`
- Create: `app/api/auth/change-password/route.ts`
- Modify: `lib/admin/auth.ts` (full rewrite — now a thin `fetch` wrapper around the
  three routes above, called from the client)

**Interfaces:**
- Produces: `createClient(): Promise<SupabaseClient<Database>>` (`lib/supabase/server.ts`,
  server-only); `signIn(email: string, password: string): Promise<{ error: string | null }>`,
  `signOut(): Promise<void>`,
  `changePassword(currentPassword: string, newPassword: string): Promise<{ error: string | null }>`
  (`lib/admin/auth.ts`, client-safe — these just call `fetch`)

- [ ] **Step 1: Console — create the admin user**

At [supabase.com/dashboard](https://supabase.com/dashboard) → your `remys-wedding`
project → **Authentication** → **Users** → **Add user** → **Create new user**. Enter an
email and password, and check **Auto Confirm User** (so no email-verification step
blocks first login — this is a single hand-created admin account, not public signup).
Save the email/password somewhere safe; you'll use them to log in once this plan wires
the login screen (Task 3).

- [ ] **Step 2: Install `axios` and `@tanstack/react-query`**

```bash
pnpm add axios @tanstack/react-query
```

These aren't consumed until the next plan (Admin UI Wiring) — installing now just locks
the versions per your request, so Task 3's minimal auth-screen wiring and the next
plan's data wiring build against the same lockfile entry.

- [ ] **Step 3: Write `lib/supabase/server.ts`**

```ts
import "server-only"

import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import type { Database } from "@/lib/supabase/types"

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { httpOnly: true },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

- [ ] **Step 4: Write `app/api/auth/login/route.ts`**

```ts
import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "Thiếu email hoặc mật khẩu" }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: body.email,
    password: body.password,
  })

  if (error) {
    return NextResponse.json({ error: "Sai email hoặc mật khẩu" }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: Write `app/api/auth/logout/route.ts`**

```ts
import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 6: Write `app/api/auth/change-password/route.ts`**

```ts
import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.currentPassword || !body?.newPassword) {
    return NextResponse.json({ error: "Thiếu dữ liệu" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: body.currentPassword,
  })
  if (reauthError) {
    return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 401 })
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: body.newPassword,
  })
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 7: Rewrite `lib/admin/auth.ts`**

Replace the entire file (deletes `checkCredentials`, `setSession`, `clearSession`,
`hasSession`, `DEMO_CREDENTIALS`). This file is imported from client components, so it
only ever calls `fetch` against our own routes — never Supabase directly:

```ts
export async function signIn(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (res.ok) return { error: null }
  const body = await res.json().catch(() => ({}))
  return { error: body.error ?? "Đăng nhập thất bại" }
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" })
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ error: string | null }> {
  const res = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (res.ok) return { error: null }
  const body = await res.json().catch(() => ({}))
  return { error: body.error ?? "Đổi mật khẩu thất bại" }
}
```

- [ ] **Step 8: Typecheck**

Run: `pnpm typecheck`
Expected: FAILS — every file that still imports `checkCredentials`/`hasSession`/
`setSession`/`clearSession` (the 4 UI files fixed in Task 3) now errors. This is
expected; Task 3 fixes them. Confirm the errors are only in those 4 files, not new ones.

- [ ] **Step 9: Commit**

```bash
git add lib/supabase/server.ts app/api/auth lib/admin/auth.ts package.json pnpm-lock.yaml
git commit -m "feat: replace mock admin auth with real Supabase Auth via httpOnly SSR routes"
```

---

## Task 2: `proxy.ts` — extend session gating to `/api/*`, keep `/api/auth/login` public

**Files:**
- Modify: `proxy.ts`

**Interfaces:**
- Produces: unauthenticated `GET/POST /api/*` (except `POST /api/auth/login`) →
  `401 { error: "Unauthorized" }` JSON (no redirect — a `fetch()` caller can't follow an
  HTML redirect usefully); unauthenticated `/admin/*` (except `/admin/login`) →
  unchanged `307` redirect to `/admin/login`; **new:** an already-authenticated request
  to `/admin/login` → `307` redirect to `/admin` (replaces the old client-side
  "already logged in" check, since there's no browser Supabase client left to do it).

- [ ] **Step 1: Update the proxy function and matcher**

```ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { httpOnly: true },
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
  const isPublicApiRoute = pathname === "/api/auth/login"
  const isApiRoute = pathname.startsWith("/api") && !isPublicApiRoute
  const isAdminRoute = pathname.startsWith("/admin")
  const isLoginRoute = pathname === "/admin/login"

  if (!user && isApiRoute) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user && isLoginRoute) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  if (!user && isAdminRoute && !isLoginRoute) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
}
```

- [ ] **Step 2: Verify — unauthenticated requests are blocked correctly, login route stays public**

Run: `pnpm dev` (note the port it starts on — 3000, or the next free one), then in
another terminal:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/albums
curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}\n" http://localhost:3000/admin
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin/login
curl -s -X POST -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"x","password":"y"}'
```

Expected: `401` (JSON, no redirect) for `/api/albums`; `307 -> .../admin/login` for
`/admin`; `200` for `/admin/login`; and `401` (from the route handler itself, not
proxy — wrong credentials, but the request *reached* the handler) for
`/api/auth/login`, confirming it isn't blocked by the blanket `/api/*` gate. Stop the
dev server after (`Ctrl+C`, or `kill` the background job).

- [ ] **Step 3: Commit**

```bash
git add proxy.ts
git commit -m "feat: extend proxy session gating to /api/*, keep /api/auth/login public"
```

---

## Task 3: Wire login, logout, and change-password screens to real auth

**Files:**
- Modify: `screens/admin/login/index.tsx`
- Modify: `components/admin/admin-sidebar.tsx`
- Modify: `screens/admin/account/components/change-password-card.tsx`
- Modify: `components/admin/admin-shell.tsx`

**Interfaces:**
- Consumes: `signIn`, `signOut`, `changePassword` (Task 1, all `fetch`-backed, safe to
  call from client components).

- [ ] **Step 1: Rewrite `screens/admin/login/index.tsx`**

The "already logged in, redirect away" check moves server-side into `proxy.ts` (Task 2)
now, so this screen no longer needs any client-side session check at all:

```tsx
"use client"

import { useState, type FormEvent } from "react"
import { Loader2, Lock } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "@/lib/admin/auth"
import { APP_CONFIG } from "@/config/config"

export function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const { error } = await signIn(email, password)
    if (error) {
      setError("Sai email hoặc mật khẩu.")
      setSubmitting(false)
      return
    }
    router.push("/admin")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-serif text-3xl tracking-wide text-foreground">
            Remy&rsquo;s<span className="text-clay">.</span>
          </span>
          <p className="mt-1 text-sm text-muted-foreground">Quản trị</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="size-4" />
            Đăng nhập để quản lý {APP_CONFIG.name}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="admin@remys.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={submitting} className="mt-2 w-full">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Đăng nhập
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
```

(Note: the "Demo: admin@remys.vn / remys2026" hint paragraph is removed — it described
the deleted mock credentials.)

- [ ] **Step 2: Update `components/admin/admin-sidebar.tsx`**

Change the import and `handleLogout`:

```tsx
import { signOut } from "@/lib/admin/auth"
```

```tsx
  async function handleLogout() {
    await signOut()
    router.push("/admin/login")
  }
```

- [ ] **Step 3: Update `screens/admin/account/components/change-password-card.tsx`**

Change `handleSubmit` to await the now-async `changePassword`, which returns
`{ error: string | null }` instead of a boolean:

```tsx
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const result = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    })
    if (!result.success) {
      setErrors(fieldErrors(result.error.issues))
      return
    }

    const { error } = await changePassword(currentPassword, newPassword)
    if (error) {
      setErrors({ currentPassword: "Mật khẩu hiện tại không đúng" })
      return
    }

    setErrors({})
    toast.success("Đã đổi mật khẩu")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }
```

- [ ] **Step 4: Simplify `components/admin/admin-shell.tsx`**

`proxy.ts` (Task 2) now blocks unauthenticated requests before this component ever
mounts, so its own client-side `hasSession()` recheck is redundant — remove it:

```tsx
"use client"

import { useState } from "react"
import { Menu } from "lucide-react"

import { AdminSidebarNav } from "@/components/admin/admin-sidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-background md:block">
        <AdminSidebarNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-background px-4 py-3 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <button
                  type="button"
                  className="p-1 text-foreground"
                  aria-label="Mở menu"
                />
              }
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="left"
              showCloseButton={false}
              className="w-60 p-0"
            >
              <AdminSidebarNav onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-serif text-lg tracking-wide text-foreground">
            Remy&rsquo;s<span className="text-clay">.</span> Quản trị
          </span>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass with no errors (the Task 1 Step 8 failures are now fixed).

- [ ] **Step 6: Manual verify — real login round-trip**

Run `pnpm dev`, open the printed URL, go to `/admin/login`, sign in with the email/
password from Task 1 Step 1. Expected: redirected to `/admin`, sidebar renders, and
clicking "Đăng xuất" returns you to `/admin/login`. Try `/admin` directly while logged
out (e.g. in a private window) — expected: redirected to `/admin/login`. Then, while
still logged in, navigate directly to `/admin/login` — expected: bounced straight to
`/admin` (the new proxy check from Task 2). Open DevTools → Application → Cookies and
confirm the `sb-...-auth-token` cookie shows `HttpOnly: true`. Stop the dev server
after.

- [ ] **Step 7: Commit**

```bash
git add screens/admin/login/index.tsx components/admin/admin-sidebar.tsx \
  screens/admin/account/components/change-password-card.tsx \
  components/admin/admin-shell.tsx
git commit -m "feat: wire admin login, logout, and change-password to real Supabase Auth"
```

---

## Task 4: `lib/r2.ts` — add `buildHeroImageKey` for the multi-image hero mode

**Files:**
- Modify: `lib/r2.ts`
- Modify: `lib/r2.test.ts`

**Interfaces:**
- Produces: `buildHeroImageKey(fileName: string): string` — unlike `buildHeroKey`
  (fixed `site-assets/hero.<ext>`, one file, overwritten on each hero-video upload),
  this needs a unique key per file since `hero_images` (Plan 1) can hold many rows.

- [ ] **Step 1: Write the failing test**

In `lib/r2.test.ts`, add `buildHeroImageKey` to the existing import line
(`import { buildHeroKey, buildPhotoKey, imageUrl } from "./r2"` becomes
`import { buildHeroImageKey, buildHeroKey, buildPhotoKey, imageUrl } from "./r2"`), then
add:

```ts
describe("buildHeroImageKey", () => {
  it("nests under site-assets/hero-images/ with a random name and the original extension", () => {
    const key = buildHeroImageKey("beach.jpg")
    expect(key).toMatch(/^site-assets\/hero-images\/[0-9a-f-]{36}\.jpg$/)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `buildHeroImageKey` is not exported from `./r2`.

- [ ] **Step 3: Add `buildHeroImageKey` to `lib/r2.ts`**

Add next to `buildHeroKey`:

```ts
export function buildHeroImageKey(fileName: string): string {
  return `site-assets/hero-images/${crypto.randomUUID()}${fileExtension(fileName)}`
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test`
Expected: PASS — all `lib/r2.test.ts` cases green (5 tests now).

- [ ] **Step 5: Commit**

```bash
git add lib/r2.ts lib/r2.test.ts
git commit -m "feat: add buildHeroImageKey for the multi-image hero background mode"
```

---

## Task 5: Shared request-validation helper and zod schemas

**Files:**
- Create: `lib/api/validate.ts`
- Create: `lib/api/schemas.ts`
- Create: `lib/api/schemas.test.ts`

**Interfaces:**
- Produces: `parseJsonBody<T>(request: Request, schema: T): Promise<{ data: z.infer<T> } | { error: NextResponse }>`;
  zod schemas consumed by every route handler in Tasks 6-8:
  `presignRequestSchema`, `createAlbumSchema`, `updateAlbumSchema`, `addPhotoSchema`,
  `createVideoSchema`, `updateVideoSchema`, `addHeroImageSchema`,
  `updateHeroImageSchema`, `updateSettingsSchema`.

- [ ] **Step 1: Write `lib/api/validate.ts`**

```ts
import { NextResponse } from "next/server"
import type { ZodType, z } from "zod"

export async function parseJsonBody<T extends ZodType>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return {
      error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    }
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    return {
      error: NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      ),
    }
  }

  return { data: result.data }
}
```

- [ ] **Step 2: Write the failing schema tests**

Create `lib/api/schemas.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import {
  createAlbumSchema,
  presignRequestSchema,
  updateSettingsSchema,
} from "./schemas"

describe("presignRequestSchema", () => {
  it("requires albumSlug for kind=album-photo", () => {
    const result = presignRequestSchema.safeParse({
      kind: "album-photo",
      fileName: "a.jpg",
      contentType: "image/jpeg",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a non-image contentType for kind=hero-image", () => {
    const result = presignRequestSchema.safeParse({
      kind: "hero-image",
      fileName: "a.mp4",
      contentType: "video/mp4",
    })
    expect(result.success).toBe(false)
  })

  it("accepts a valid hero-video request", () => {
    const result = presignRequestSchema.safeParse({
      kind: "hero-video",
      fileName: "bg.mp4",
      contentType: "video/mp4",
    })
    expect(result.success).toBe(true)
  })
})

describe("createAlbumSchema", () => {
  it("rejects an unknown category", () => {
    const result = createAlbumSchema.safeParse({
      category: "video",
      title: "Test",
      slug: "test",
    })
    expect(result.success).toBe(false)
  })

  it("accepts a minimal valid payload", () => {
    const result = createAlbumSchema.safeParse({
      category: "wedding",
      title: "Test",
      slug: "test",
    })
    expect(result.success).toBe(true)
  })
})

describe("updateSettingsSchema", () => {
  it("accepts a partial patch", () => {
    const result = updateSettingsSchema.safeParse({ email: "a@b.com" })
    expect(result.success).toBe(true)
  })

  it("rejects an invalid hero_background_mode", () => {
    const result = updateSettingsSchema.safeParse({
      hero_background_mode: "slideshow",
    })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — `lib/api/schemas.ts` doesn't exist yet.

- [ ] **Step 4: Write `lib/api/schemas.ts`**

```ts
import { z } from "zod"

export const presignRequestSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("album-photo"),
    fileName: z.string().min(1),
    contentType: z.string().startsWith("image/"),
    albumSlug: z.string().min(1),
  }),
  z.object({
    kind: z.literal("hero-video"),
    fileName: z.string().min(1),
    contentType: z.string().startsWith("video/"),
  }),
  z.object({
    kind: z.literal("hero-image"),
    fileName: z.string().min(1),
    contentType: z.string().startsWith("image/"),
  }),
])

export const createAlbumSchema = z.object({
  category: z.enum(["pre_wedding", "wedding"]),
  title: z.string().min(1),
  slug: z.string().min(1),
  eventDate: z.string().nullable().optional(),
})

export const updateAlbumSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  event_date: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  cover_image_key: z.string().nullable().optional(),
  highlight_video_url: z.string().nullable().optional(),
  is_featured: z.boolean().optional(),
  is_published: z.boolean().optional(),
  sort_order: z.number().int().optional(),
})

export const addPhotoSchema = z.object({
  imageKey: z.string().min(1),
  sortOrder: z.number().int(),
})

export const createVideoSchema = z.object({
  title: z.string().min(1),
  location: z.string().min(1),
  eventDate: z.string().min(1),
  youtubeUrl: z.string().min(1),
})

export const updateVideoSchema = z.object({
  title: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  event_date: z.string().min(1).optional(),
  youtube_url: z.string().min(1).optional(),
  is_published: z.boolean().optional(),
})

export const addHeroImageSchema = z.object({
  imageKey: z.string().min(1),
  sortOrder: z.number().int(),
})

export const updateHeroImageSchema = z.object({
  sortOrder: z.number().int(),
})

export const updateSettingsSchema = z.object({
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  zalo_link: z.string().nullable().optional(),
  facebook_link: z.string().nullable().optional(),
  instagram_link: z.string().nullable().optional(),
  hero_background_mode: z.enum(["video", "images"]).optional(),
  hero_video_key: z.string().nullable().optional(),
})
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm test`
Expected: PASS — all tests green, including the new `lib/api/schemas.test.ts` cases.

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/api/validate.ts lib/api/schemas.ts lib/api/schemas.test.ts
git commit -m "feat: add API request validation helper and zod schemas"
```

---

## Task 6: Upload presign route + Albums/Photos API routes

**Files:**
- Create: `app/api/uploads/presign/route.ts`
- Create: `app/api/albums/route.ts`
- Create: `app/api/albums/[id]/route.ts`
- Create: `app/api/albums/[id]/photos/route.ts`
- Create: `app/api/albums/[id]/photos/[photoId]/route.ts`

**Interfaces:**
- Consumes: `presignUpload`, `buildPhotoKey`, `buildHeroKey`, `buildHeroImageKey`
  (`lib/r2.ts`); `listAllAlbums`, `createAlbum`, `updateAlbum`, `deleteAlbum`,
  `addPhoto`, `deletePhoto` (`lib/data/albums.ts`); `parseJsonBody` (Task 5);
  `presignRequestSchema`, `createAlbumSchema`, `updateAlbumSchema`, `addPhotoSchema`
  (Task 5).

- [ ] **Step 1: Write `app/api/uploads/presign/route.ts`**

```ts
import { NextResponse } from "next/server"

import { presignRequestSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { buildHeroImageKey, buildHeroKey, buildPhotoKey, presignUpload } from "@/lib/r2"

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, presignRequestSchema)
  if ("error" in parsed) return parsed.error
  const body = parsed.data

  const key =
    body.kind === "album-photo"
      ? buildPhotoKey(body.albumSlug, body.fileName)
      : body.kind === "hero-video"
        ? buildHeroKey(body.fileName)
        : buildHeroImageKey(body.fileName)

  const uploadUrl = await presignUpload(key, body.contentType)
  return NextResponse.json({ uploadUrl, key })
}
```

- [ ] **Step 2: Write `app/api/albums/route.ts`**

```ts
import { NextResponse } from "next/server"

import { createAlbumSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { createAlbum, listAllAlbums } from "@/lib/data/albums"

export async function GET() {
  const albums = await listAllAlbums()
  return NextResponse.json(albums)
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, createAlbumSchema)
  if ("error" in parsed) return parsed.error
  const album = await createAlbum(parsed.data)
  return NextResponse.json(album, { status: 201 })
}
```

- [ ] **Step 3: Write `app/api/albums/[id]/route.ts`**

```ts
import { NextResponse } from "next/server"

import { updateAlbumSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { deleteAlbum, updateAlbum } from "@/lib/data/albums"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const parsed = await parseJsonBody(request, updateAlbumSchema)
  if ("error" in parsed) return parsed.error
  const album = await updateAlbum(id, parsed.data)
  return NextResponse.json(album)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await deleteAlbum(id)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Write `app/api/albums/[id]/photos/route.ts`**

```ts
import { NextResponse } from "next/server"

import { addPhotoSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { addPhoto } from "@/lib/data/albums"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const parsed = await parseJsonBody(request, addPhotoSchema)
  if ("error" in parsed) return parsed.error
  const photo = await addPhoto(id, parsed.data.imageKey, parsed.data.sortOrder)
  return NextResponse.json(photo, { status: 201 })
}
```

- [ ] **Step 5: Write `app/api/albums/[id]/photos/[photoId]/route.ts`**

```ts
import { NextResponse } from "next/server"

import { deletePhoto } from "@/lib/data/albums"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params
  await deletePhoto(photoId)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 6: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass.

- [ ] **Step 7: Manual verify — full round trip with a real session cookie**

Run `pnpm dev`, log in at `/admin/login` in the browser (Task 3's flow). Open browser
DevTools → Application/Storage → Cookies → copy the value of the cookie starting with
`sb-` (the httpOnly Supabase session cookie set by `/api/auth/login`; DevTools can
still show its value in the Application tab even though page JS can't read it). Then,
with the dev server still running:

```bash
COOKIE='sb-btxeflwgszliholnnfqy-auth-token=PASTE_VALUE_HERE'

curl -s -X POST http://localhost:3000/api/uploads/presign \
  -H "Cookie: $COOKIE" -H "Content-Type: application/json" \
  -d '{"kind":"hero-video","fileName":"test.mp4","contentType":"video/mp4"}'
# Expected: {"uploadUrl":"https://...","key":"site-assets/hero.mp4"}

curl -s -X POST http://localhost:3000/api/albums \
  -H "Cookie: $COOKIE" -H "Content-Type: application/json" \
  -d '{"category":"wedding","title":"API Test","slug":"api-test-verify"}'
# Expected: 201, a full album JSON row with is_published:false
```

Copy the returned album `id`, then:

```bash
ALBUM_ID='paste-id-here'

curl -s -X DELETE "http://localhost:3000/api/albums/$ALBUM_ID" -H "Cookie: $COOKIE"
# Expected: {"ok":true}
```

Confirm in the Supabase **Table Editor** that the test album row is gone. Stop the dev
server after.

- [ ] **Step 8: Commit**

```bash
git add app/api/uploads app/api/albums
git commit -m "feat: add upload presign and albums/photos API routes"
```

---

## Task 7: Videos API routes

**Files:**
- Create: `app/api/videos/route.ts`
- Create: `app/api/videos/[id]/route.ts`

**Interfaces:**
- Consumes: `listAllVideos`, `createVideo`, `updateVideo`, `deleteVideo`
  (`lib/data/videos.ts`); `createVideoSchema`, `updateVideoSchema` (Task 5).

- [ ] **Step 1: Write `app/api/videos/route.ts`**

```ts
import { NextResponse } from "next/server"

import { createVideoSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { createVideo, listAllVideos } from "@/lib/data/videos"

export async function GET() {
  const videos = await listAllVideos()
  return NextResponse.json(videos)
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, createVideoSchema)
  if ("error" in parsed) return parsed.error
  const video = await createVideo(parsed.data)
  return NextResponse.json(video, { status: 201 })
}
```

- [ ] **Step 2: Write `app/api/videos/[id]/route.ts`**

```ts
import { NextResponse } from "next/server"

import { updateVideoSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { deleteVideo, updateVideo } from "@/lib/data/videos"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const parsed = await parseJsonBody(request, updateVideoSchema)
  if ("error" in parsed) return parsed.error
  const video = await updateVideo(id, parsed.data)
  return NextResponse.json(video)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await deleteVideo(id)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass.

- [ ] **Step 4: Manual verify**

Same pattern as Task 6 Step 7 (dev server + browser login + copied `sb-` cookie):

```bash
curl -s -X POST http://localhost:3000/api/videos \
  -H "Cookie: $COOKIE" -H "Content-Type: application/json" \
  -d '{"title":"API Test","location":"Test","eventDate":"2026-01-01","youtubeUrl":"https://youtube.com/watch?v=test"}'
# Expected: 201, a full video JSON row with is_published:false
```

Copy the returned `id`, then confirm `PATCH .../api/videos/<id>` with
`{"is_published":true}` returns `is_published:true`, and
`DELETE .../api/videos/<id>` returns `{"ok":true}` and the row disappears from the
Supabase Table Editor.

- [ ] **Step 5: Commit**

```bash
git add app/api/videos
git commit -m "feat: add videos API routes"
```

---

## Task 8: Hero images and settings API routes

**Files:**
- Create: `app/api/hero-images/route.ts`
- Create: `app/api/hero-images/[id]/route.ts`
- Create: `app/api/settings/route.ts`

**Interfaces:**
- Consumes: `listHeroImages`, `addHeroImage`, `updateHeroImageSortOrder`,
  `deleteHeroImage` (`lib/data/hero-images.ts`); `getSiteSettings`,
  `updateSiteSettings` (`lib/data/settings.ts`); `addHeroImageSchema`,
  `updateHeroImageSchema`, `updateSettingsSchema` (Task 5).

- [ ] **Step 1: Write `app/api/hero-images/route.ts`**

```ts
import { NextResponse } from "next/server"

import { addHeroImageSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { addHeroImage, listHeroImages } from "@/lib/data/hero-images"

export async function GET() {
  const images = await listHeroImages()
  return NextResponse.json(images)
}

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, addHeroImageSchema)
  if ("error" in parsed) return parsed.error
  const image = await addHeroImage(parsed.data.imageKey, parsed.data.sortOrder)
  return NextResponse.json(image, { status: 201 })
}
```

- [ ] **Step 2: Write `app/api/hero-images/[id]/route.ts`**

```ts
import { NextResponse } from "next/server"

import { updateHeroImageSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { deleteHeroImage, updateHeroImageSortOrder } from "@/lib/data/hero-images"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const parsed = await parseJsonBody(request, updateHeroImageSchema)
  if ("error" in parsed) return parsed.error
  const image = await updateHeroImageSortOrder(id, parsed.data.sortOrder)
  return NextResponse.json(image)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await deleteHeroImage(id)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Write `app/api/settings/route.ts`**

```ts
import { NextResponse } from "next/server"

import { updateSettingsSchema } from "@/lib/api/schemas"
import { parseJsonBody } from "@/lib/api/validate"
import { getSiteSettings, updateSiteSettings } from "@/lib/data/settings"

export async function GET() {
  const settings = await getSiteSettings()
  return NextResponse.json(settings)
}

export async function PATCH(request: Request) {
  const parsed = await parseJsonBody(request, updateSettingsSchema)
  if ("error" in parsed) return parsed.error
  const settings = await updateSiteSettings(parsed.data)
  return NextResponse.json(settings)
}
```

- [ ] **Step 4: Typecheck and lint**

Run: `pnpm typecheck && pnpm lint`
Expected: both pass.

- [ ] **Step 5: Manual verify**

Same cookie-based pattern:

```bash
curl -s -X PATCH http://localhost:3000/api/settings \
  -H "Cookie: $COOKIE" -H "Content-Type: application/json" \
  -d '{"address":"Verify Address"}'
# Expected: 200, settings row with address:"Verify Address"

curl -s http://localhost:3000/api/settings -H "Cookie: $COOKIE"
# Expected: same address reflected back
```

Revert the test value if you want the row clean:

```bash
curl -s -X PATCH http://localhost:3000/api/settings \
  -H "Cookie: $COOKIE" -H "Content-Type: application/json" \
  -d '{"address":null}'
```

- [ ] **Step 6: Commit**

```bash
git add app/api/hero-images app/api/settings
git commit -m "feat: add hero images and settings API routes"
```

---

## Task 9: Full-surface sanity pass

No new files — this task is a final combined check across everything this plan built,
run once as a single session so gaps surface before moving to the next plan (Admin UI
Wiring, which will make every admin screen call these routes for real via react-query).

- [ ] **Step 1: Full verification suite**

Run: `pnpm typecheck && pnpm lint && pnpm test`
Expected: all three pass with zero errors/warnings introduced by this plan.

- [ ] **Step 2: Unauthenticated boundary check**

With the dev server running and **not** logged in (or in a private browser window),
confirm every data route still rejects cleanly, and login stays reachable:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/albums
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/videos
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/settings
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/hero-images
curl -s -X POST -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"x","password":"y"}'
```

Expected: `401` for the first four, `401` for the last one too (wrong credentials,
but reached the handler — not blocked by proxy).

- [ ] **Step 3: Authenticated round trip, one full album with a real uploaded photo**

Using the `$COOKIE` from Task 6 Step 7: presign an `album-photo` upload (with a real
`albumSlug`), `PUT` an actual small file to the returned `uploadUrl`, `POST` it to
`/api/albums/<id>/photos`, then `GET /api/albums` and confirm the photo's `image_key`
is present under that album. Clean up by deleting the test album (cascades the photo
row and, per `lib/data/albums.ts`, its R2 object).

- [ ] **Step 4: No commit needed**

This task only verifies work already committed in Tasks 1-8.
