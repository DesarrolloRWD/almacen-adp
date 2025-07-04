import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que no requieren autenticación
const publicRoutes = ['/login']

export function middleware(request: NextRequest) {
  // Obtener el token del localStorage (esto solo funciona en el cliente, no en el middleware)
  // En el middleware, debemos obtener el token de las cookies
  const token = request.cookies.get('token')?.value
  
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`)
  )

  // Si es la ruta raíz, redirigir según si hay token o no
  if (request.nextUrl.pathname === '/') {
    if (token) {
      // Si hay token, redirigir a la página principal
      const homeUrl = new URL('/productos', request.url)
      return NextResponse.redirect(homeUrl)
    } else {
      // Si no hay token, redirigir al login
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Si no hay token y la ruta no es pública, redirigir al login
  if (!token && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  // Si hay token y la ruta es /login, redirigir a la página principal
  if (token && request.nextUrl.pathname === '/login') {
    const homeUrl = new URL('/productos', request.url)
    return NextResponse.redirect(homeUrl)
  }
  
  // Si el usuario intenta navegar a la página de login usando la navegación del navegador
  // y ya tiene un token, redirigirlo a la página principal
  if (token && request.headers.get('referer') && !request.headers.get('referer')?.includes('/login')) {
    const referer = request.headers.get('referer') || ''
    if (request.nextUrl.pathname === '/login' && referer.includes(request.nextUrl.origin)) {
      const homeUrl = new URL('/productos', request.url)
      return NextResponse.redirect(homeUrl)
    }
  }

  return NextResponse.next()
}

// Configurar en qué rutas se ejecutará el middleware
export const config = {
  matcher: [
    // Excluir archivos estáticos y API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
