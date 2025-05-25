"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
      router.replace("/login")
    } else {
      // Si está autenticado, redirigir a la página de productos
      router.replace("/productos")
    }
  }, [router, isAuthenticated])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-naval-800">Redireccionando...</h1>
        <p className="text-muted-foreground mt-2">Por favor espere mientras es redirigido al sistema.</p>
      </div>
    </div>
  )
}
