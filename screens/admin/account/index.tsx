"use client"

import { ChangePasswordCard } from "@/screens/admin/account/components/change-password-card"

export function AccountScreen() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-foreground">Tài khoản</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý thông tin đăng nhập quản trị
        </p>
      </div>

      <div className="max-w-xl">
        <ChangePasswordCard />
      </div>
    </div>
  )
}
