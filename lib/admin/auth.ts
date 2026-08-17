const SESSION_KEY = "remys-admin-session"
const PASSWORD_KEY = "remys-admin-password"

export const DEMO_CREDENTIALS = {
  email: "admin@remys.vn",
  password: "remys2026",
}

function getStoredPassword(): string {
  if (typeof window === "undefined") return DEMO_CREDENTIALS.password
  return localStorage.getItem(PASSWORD_KEY) ?? DEMO_CREDENTIALS.password
}

export function checkCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
    password === getStoredPassword()
  )
}

export function changePassword(
  currentPassword: string,
  newPassword: string
): boolean {
  if (currentPassword !== getStoredPassword()) return false
  localStorage.setItem(PASSWORD_KEY, newPassword)
  return true
}

export function setSession() {
  localStorage.setItem(SESSION_KEY, "1")
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function hasSession(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(SESSION_KEY) === "1"
}
