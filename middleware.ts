import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Rotas públicas — loja, login, APIs abertas e assets estáticos
  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/api/n8n') ||
    pathname.startsWith('/api/icon') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/offline.html' ||
    pathname === '/' ||
    pathname.startsWith('/produto') ||
    pathname.startsWith('/categoria') ||
    /\.(svg|png|jpg|jpeg|gif|ico|webp|woff2?|txt|xml)$/i.test(pathname)

  if (isPublic) return supabaseResponse

  // Checkout e perfil: redireciona para login se não autenticado
  if (!user) {
    const next = encodeURIComponent(pathname)
    return NextResponse.redirect(new URL(`/login?next=${next}`, request.url))
  }

  // Busca profile para checar role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_admin')
    .eq('id', user.id)
    .maybeSingle()

  const role = profile?.role || ''
  const isAdmin = !!profile?.is_admin
  const isSuperAdmin = role === 'super_admin' || (isAdmin && user.email === 'fabiobz@gmail.com')
  const isAdminRole = isAdmin || role === 'admin'
  const isEntregador = role === 'entregador'

  // Proteção de rotas por role
  if (pathname.startsWith('/super-admin') && !isSuperAdmin) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (pathname.startsWith('/admin') && !isAdminRole && !isSuperAdmin) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (pathname.startsWith('/entregador') && !isEntregador) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icons/|sw\\.js|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|ico|webp|woff2?|txt|xml)$).*)',
  ],
}
