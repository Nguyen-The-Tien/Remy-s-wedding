import { NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.currentPassword || !body?.newPassword) {
    return NextResponse.json({ error: "Thiếu dữ liệu" }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: body.currentPassword,
  })
  if (reauthError) {
    return NextResponse.json({ error: "Mật khẩu hiện tại không đúng" }, { status: 401 })
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: body.newPassword,
  })
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
