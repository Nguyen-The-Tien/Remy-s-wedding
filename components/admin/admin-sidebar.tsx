"use client"

import {
  Film,
  GalleryVerticalEnd,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { clearSession } from "@/lib/admin/auth"

const NAV_ITEMS = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  {
    href: "/admin/albums",
    label: "Albums",
    icon: GalleryVerticalEnd,
    exact: false,
  },
  { href: "/admin/videos", label: "Videos", icon: Film, exact: false },
  { href: "/admin/settings", label: "Cài đặt", icon: Settings, exact: true },
  { href: "/admin/account", label: "Tài khoản", icon: UserRound, exact: true },
]

export function AdminSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  function handleLogout() {
    clearSession()
    router.push("/admin/login")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="font-serif text-xl tracking-wide text-foreground"
        >
          Remy&rsquo;s<span className="text-clay">.</span>
        </Link>
        <p className="mt-0.5 text-xs text-muted-foreground">Quản trị</p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/75 hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2.5 text-foreground/75"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Đăng xuất
        </Button>
      </div>
    </div>
  )
}
