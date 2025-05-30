"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { login as apiLogin } from "@/lib/api"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  user: any | null
  login: (usuario: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Verificar si hay un token guardado al cargar la página
  useEffect(() => {
    // Obtener token del localStorage
    const storedToken = localStorage.getItem("token")
    
    // Obtener token de las cookies
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return undefined
    }
    
    const cookieToken = getCookie("token")
    
    // Usar el token de localStorage o de cookies
    const token = storedToken || cookieToken
    
    if (token) {
      // Si hay token en cualquiera de los dos lugares, establecer como autenticado
      setToken(token)
      setIsAuthenticated(true)
      // Aquí podrías obtener información del usuario si es necesario
      setUser({ nombre: "Usuario" }) // Placeholder
      
      // Asegurar que el token esté en ambos lugares
      if (!storedToken && cookieToken) {
        localStorage.setItem("token", cookieToken)
      } else if (storedToken && !cookieToken) {
        document.cookie = `token=${storedToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`
      }
    }
    
    setIsLoading(false)
  }, [])

  // Función para iniciar sesión
  const login = async (usuario: string, password: string): Promise<boolean> => {
    try {
      // Log para depuración
      // ////console.log('Intentando login con:', { usuario, password: '***' })
      
      const result = await apiLogin({ usuario, pswd: password })
      
      // Log para depuración
      // ////console.log('Resultado del login:', result)
      
      // Guardar el token en localStorage, cookie y en el estado
      if (result.success && result.token) {
        // ////console.log('Login exitoso, guardando token')
        localStorage.setItem("token", result.token)
        // Guardar en cookie para que el middleware pueda acceder
        document.cookie = `token=${result.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`
        setToken(result.token)
        setIsAuthenticated(true)
        setUser({ nombre: usuario }) // Puedes guardar más información del usuario si la API la proporciona
        return true
      } else {
        console.error('Login fallido:', result.message || 'No se proporcionó mensaje de error')
        return false
      }
    } catch (error) {
      console.error("Error de autenticación:", error)
      return false
    }
  }

  // Función para cerrar sesión
  const logout = () => {
    // Eliminar token del localStorage
    localStorage.removeItem("token")
    // Eliminar cookie de token
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict"
    // Actualizar estado
    setToken(null)
    setIsAuthenticated(false)
    setUser(null)
    // Redirigir al login y reemplazar la entrada en el historial
    // Esto evita que el usuario pueda volver a la aplicación con el botón de atrás
    router.replace("/login")
  }

  // Si está cargando, no renderizar nada o mostrar un spinner
  if (isLoading) {
    return null // O un componente de carga
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
