import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground/70">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}
