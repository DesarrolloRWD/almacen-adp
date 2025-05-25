"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/hooks"
import Sidebar from "./sidebar"
import Header from "./header"
import ProtectedRoute from "./protected-route"

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  
  // Efecto para manejar la navegación
  useEffect(() => {
    // Si el usuario no está autenticado y no está en la página de login,
    // redirigirlo a la página de login y reemplazar la entrada en el historial
    if (!isAuthenticated && pathname !== "/login") {
      router.replace("/login")
    }
    
    // Si el usuario está autenticado y está en la página de login,
    // redirigirlo a la página principal y reemplazar la entrada en el historial
    if (isAuthenticated && pathname === "/login") {
      router.replace("/productos")
    }
    
    // Prevenir la navegación hacia atrás a la página de login
    const handlePopState = () => {
      if (isAuthenticated && window.location.pathname === "/login") {
        router.replace("/productos")
      }
    }
    
    window.addEventListener("popstate", handlePopState)
    
    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [isAuthenticated, pathname, router])
  
  // Si está en la página de login, mostrar solo el contenido de login sin sidebar ni header
  if (pathname === "/login") {
    return <>{children}</>
  }
  
  // Para todas las demás páginas, usar ProtectedRoute para verificar autenticación
  return (
    <ProtectedRoute>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
