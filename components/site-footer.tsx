export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background py-7 text-muted-foreground">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 px-6 text-xs tracking-wide md:flex-row md:px-10">
        <p>© {new Date().getFullYear()} Remy&rsquo;s Studio. All rights reserved.</p>
        <p>Ảnh &amp; video cưới — Việt Nam</p>
      </div>
    </footer>
  )
}
