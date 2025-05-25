"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"
import { useAuth } from "@/hooks"
import LoadingOverlay from "@/components/loading-overlay"

export default function LoginPage() {
  const [usuario, setUsuario] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showTransition, setShowTransition] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!usuario || !password) {
      setError("Por favor ingresa usuario y contraseña")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const success = await login(usuario, password)
      if (success) {
        // Mostrar animación de transición
        setShowTransition(true)
        
        // Esperar un momento para que se vea la animación antes de redirigir
        setTimeout(() => {
          // Reemplazar la entrada actual en el historial con la página de productos
          // Esto evita que el usuario pueda volver a la página de login con el botón de atrás
          router.replace("/productos")
        }, 1500)
      } else {
        setError("Usuario o contraseña incorrectos")
        setIsLoading(false)
      }
    } catch (err) {
      setError("Error al iniciar sesión. Intenta de nuevo.")
      console.error(err)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <LoadingOverlay show={showTransition} message="Iniciando sesión..." />
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center bg-naval-600 text-white rounded-t-lg">
          <div className="flex justify-center mb-2">
            <ShieldAlert className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold">Hospital Naval</CardTitle>
          <CardDescription className="text-naval-100">Sistema de Almacén</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="usuario">Usuario</Label>
                <Input
                  id="usuario"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full bg-naval-600 hover:bg-naval-700 relative" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="opacity-0">Iniciar Sesión</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                    </div>
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Hospital Naval - Sistema de Almacén</p>
        </CardFooter>
      </Card>
    </div>
  )
}
