"use client"

import { createPortal } from "react-dom"
import { Loader2 } from "lucide-react"

export function LoadingOverlay({ active }: { active: boolean }) {
  if (!active) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <Loader2 className="size-8 animate-spin text-foreground" />
    </div>,
    document.body
  )
}
