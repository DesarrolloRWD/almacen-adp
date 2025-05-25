"use client"

import { useEffect, useState } from "react"
import { ShieldAlert } from "lucide-react"

interface LoadingOverlayProps {
  show: boolean
  message?: string
}

export default function LoadingOverlay({ show, message = "Cargando..." }: LoadingOverlayProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 500) // Esperar un poco antes de ocultar para que se vea la animación de salida
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!isVisible) return null

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-naval-600 transition-opacity duration-500 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center">
        <ShieldAlert className="h-16 w-16 text-white mb-4 animate-pulse" />
        <div className="text-white text-xl font-semibold mb-8">{message}</div>
        <div className="relative h-2 w-48 bg-naval-400 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-white rounded-full animate-loading-bar"></div>
        </div>
      </div>
    </div>
  )
}
