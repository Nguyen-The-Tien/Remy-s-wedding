import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: { httpOnly: true },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublicApiRoute = pathname === "/api/auth/login"
  const isApiRoute = pathname.startsWith("/api") && !isPublicApiRoute
  const isAdminRoute = pathname.startsWith("/admin")
  const isLoginRoute = pathname === "/admin/login"

  if (!user && isApiRoute) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (user && isLoginRoute) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  if (!user && isAdminRoute && !isLoginRoute) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  return response
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
}
