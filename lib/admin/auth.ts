export async function signIn(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (res.ok) return { error: null }
  const body = await res.json().catch(() => ({}))
  return { error: body.error ?? "Đăng nhập thất bại" }
}

export async function signOut(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" })
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ error: string | null }> {
  const res = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (res.ok) return { error: null }
  const body = await res.json().catch(() => ({}))
  return { error: body.error ?? "Đổi mật khẩu thất bại" }
}
