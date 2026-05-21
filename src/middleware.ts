import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
          Object.entries(headers ?? {}).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          )
        },
      },
    },
  )

  // IMPORTANT: do not add logic between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublic = pathname === '/login' || pathname.startsWith('/api/auth')

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirectResponse = NextResponse.redirect(url)
    // Forward any refreshed session cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach(c =>
      redirectResponse.cookies.set(c.name, c.value, c as Parameters<typeof redirectResponse.cookies.set>[2]),
    )
    return redirectResponse
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    const redirectResponse = NextResponse.redirect(url)
    // Forward any refreshed session cookies to the redirect response
    supabaseResponse.cookies.getAll().forEach(c =>
      redirectResponse.cookies.set(c.name, c.value, c as Parameters<typeof redirectResponse.cookies.set>[2]),
    )
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
