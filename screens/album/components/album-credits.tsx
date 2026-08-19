import { Camera, Clapperboard, Info, MapPin, Sparkles } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { AlbumCredit } from "@/lib/albums"

const ICONS: Record<string, LucideIcon> = {
  "Địa điểm": MapPin,
  "Chụp ảnh": Camera,
  "Quay phim": Clapperboard,
  "Trang điểm": Sparkles,
}

export function AlbumCredits({ credits }: { credits: AlbumCredit[] }) {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-[1440px] px-6 py-10 md:px-10 md:pt-10 md:pb-10">
        <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
          Thực hiện
        </p>

        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-8">
          {credits.map((credit, i) => {
            const Icon = ICONS[credit.label] ?? Info
            return (
              <div
                key={credit.label}
                className={cn(
                  "pr-6",
                  i > 0 && "lg:border-l lg:border-border lg:pl-8"
                )}
              >
                <Icon className="size-4 text-clay" strokeWidth={1.6} />
                <dt className="mt-3 text-[0.68rem] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                  {credit.label}
                </dt>
                <dd className="mt-1.5 font-serif text-xl text-foreground">
                  {credit.value}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
    </section>
  )
}
