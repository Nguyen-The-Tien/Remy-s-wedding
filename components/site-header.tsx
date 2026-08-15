"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"

const NAV_LINKS = [
  { href: "/pre-wedding", label: "Pre-wedding" },
  { href: "/wedding", label: "Wedding" },
  { href: "/videos", label: "Video cưới" },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 md:px-10">
        <Link
          href="/"
          onClick={handleLogoClick}
          className="font-serif text-2xl tracking-wide text-foreground"
        >
          Remy&rsquo;s<span className="text-clay">.</span>
        </Link>

        <nav className="hidden items-center gap-10 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[0.78rem] font-medium tracking-[0.1em] text-foreground/75 uppercase transition-colors hover:text-clay"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                className="-mr-1 p-1 text-foreground md:hidden"
                aria-label="Mở menu"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>

          <SheetContent side="right" showCloseButton={false} className="p-0">
            <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-5 md:px-10">
              <span className="font-serif text-2xl tracking-wide text-foreground">
                Remy&rsquo;s<span className="text-clay">.</span>
              </span>
              <SheetClose
                render={
                  <button
                    type="button"
                    className="-mr-1 p-1 text-foreground"
                    aria-label="Đóng menu"
                  />
                }
              >
                <X className="size-5" />
              </SheetClose>
            </div>

            <div className="flex flex-col border-t border-border px-6 md:px-10">
              {NAV_LINKS.map((link) => (
                <SheetClose
                  key={link.href}
                  nativeButton={false}
                  render={
                    <Link
                      href={link.href}
                      className="border-b border-border py-4 text-sm text-foreground last:border-none"
                    />
                  }
                >
                  {link.label}
                </SheetClose>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
