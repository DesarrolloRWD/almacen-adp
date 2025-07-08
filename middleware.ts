import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas excluidas del modo mantenimiento
const excludedRoutes = ['/mantenimiento', '/_next', '/api', '/favicon.ico', '/LG1.jpg', '/images', '/public', '/mantenimiento.html']

// Variable para activar/desactivar el modo mantenimiento
// Cambiar a false para desactivar el modo mantenimiento
const MAINTENANCE_MODE = false

// Rutas que no requieren autenticación
const publicRoutes = ['/login']

export function middleware(request: NextRequest) {
  // Si el modo mantenimiento está activado
  if (MAINTENANCE_MODE) {
    const pathname = request.nextUrl.pathname
    
    // Si ya estamos en la página de mantenimiento, no hacer nada
    if (pathname === '/mantenimiento.html') {
      return NextResponse.next()
    }
    
    // Permitir acceso a archivos estáticos necesarios para la página de mantenimiento
    const fileExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.css', '.js']
    const isStaticFile = fileExtensions.some(ext => pathname.endsWith(ext))
    
    // Comprobar si la ruta actual está excluida del modo mantenimiento
    const isExcludedRoute = excludedRoutes.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    )
    
    // Si es un archivo estático o una ruta excluida, permitir acceso
    if (isStaticFile || isExcludedRoute) {
      return NextResponse.next()
    }
    
    // Para cualquier otra ruta, redirigir al archivo HTML estático de mantenimiento
    return NextResponse.redirect(new URL('/mantenimiento.html', request.url))
  }
  
  // Código original del middleware cuando no está en modo mantenimiento
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
    // Incluir todas las rutas excepto archivos estáticos y API routes
    '/((?!api|_next/static|_next/image|_next/data|favicon.ico).*)',
  ],
}
