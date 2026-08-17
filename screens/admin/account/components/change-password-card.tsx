"use client"

import { useState, type FormEvent } from "react"
import { KeyRound } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SectionCard } from "@/components/admin/section-card"
import { changePassword } from "@/lib/admin/auth"
import {
  changePasswordSchema,
  fieldErrors,
  type ChangePasswordFormErrors,
} from "@/lib/admin/schemas"

export function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<ChangePasswordFormErrors>({})

  function handleSubmit(e: FormEvent) {
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

    const ok = changePassword(currentPassword, newPassword)
    if (!ok) {
      setErrors({ currentPassword: "Mật khẩu hiện tại không đúng" })
      return
    }

    setErrors({})
    toast.success("Đã đổi mật khẩu")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <SectionCard
      icon={KeyRound}
      title="Đổi mật khẩu"
      description="Cập nhật mật khẩu đăng nhập quản trị"
    >
      <form onSubmit={handleSubmit} className="flex max-w-sm flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
          <Input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            aria-invalid={Boolean(errors.currentPassword)}
          />
          {errors.currentPassword && (
            <p className="text-xs text-destructive">{errors.currentPassword}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="newPassword">Mật khẩu mới</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            aria-invalid={Boolean(errors.newPassword)}
          />
          {errors.newPassword && (
            <p className="text-xs text-destructive">{errors.newPassword}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={Boolean(errors.confirmPassword)}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword}</p>
          )}
        </div>

        <Button type="submit" variant="outline" className="w-fit">
          Đổi mật khẩu
        </Button>
      </form>
    </SectionCard>
  )
}
