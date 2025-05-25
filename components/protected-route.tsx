"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  // Si está cargando, mostrar un indicador de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-naval-600"></div>
      </div>
    )
  }

  // Si no está autenticado, no mostrar nada (se redirigirá en el useEffect)
  if (!isAuthenticated) {
    return null
  }

  // Si está autenticado, mostrar el contenido
  return <>{children}</>
}
