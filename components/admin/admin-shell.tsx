"use client"

import { useEffect, useState } from "react"
import { Menu } from "lucide-react"
import { useRouter } from "next/navigation"

import { AdminSidebarNav } from "@/components/admin/admin-sidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { hasSession } from "@/lib/admin/auth"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Session lives in localStorage, unavailable during SSR — the server always
  // renders the unauthorized (null) state, so this check must happen after
  // mount. Reading it via useSyncExternalStore instead races the redirect
  // against React's own resync and bounces every hard navigation to /admin.
  useEffect(() => {
    if (hasSession()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthorized(true)
    } else {
      router.replace("/admin/login")
    }
  }, [router])

  if (!authorized) return null

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
