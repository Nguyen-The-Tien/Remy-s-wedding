"use client"

import { useEffect, useState, type FormEvent } from "react"
import { Loader2, Lock } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { checkCredentials, hasSession, setSession } from "@/lib/admin/auth"
import { APP_CONFIG } from "@/config/config"

export function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (hasSession()) router.replace("/admin")
  }, [router])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    window.setTimeout(() => {
      if (checkCredentials(email, password)) {
        setSession()
        router.push("/admin")
        return
      }
      setError("Sai email hoặc mật khẩu.")
      setSubmitting(false)
    }, 300)
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

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Demo: admin@remys.vn / remys2026
        </p>
      </div>
    </main>
  )
}
