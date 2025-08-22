"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { login as apiLogin, getSpecificUser } from "@/lib/api"

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
    const checkToken = async () => {
      setIsLoading(true)
      const storedToken = localStorage.getItem("token")
      
      if (storedToken) {
        try {
          // Verificar si el token es válido obteniendo información del usuario
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          })
          
          if (response.ok) {
            const userData = await response.json()
            setToken(storedToken)
            setUser(userData)
            setIsAuthenticated(true)
          } else {
            // Token inválido, limpiar
            localStorage.removeItem("token")
            document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict"
          }
        } catch (error) {
          // Error al verificar el token
          // En caso de error, limpiar el token
          localStorage.removeItem("token")
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict"
        }
      }
      
      setIsLoading(false)
    }
    
    checkToken()
  }, [])

  // Función para obtener información completa del usuario
  const fetchUserInfo = async (username: string) => {
    try {
      
      // Usar el endpoint local para evitar problemas de CORS
      const response = await fetch('/api/users/specific', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ value: username })
      });
      
      
      
      if (response.ok) {
        const userData = await response.json();
        
        // No se requiere la imagen del usuario
        if (userData && userData.image) {
          delete userData.image;
        }
        
        return userData;
      } else {
        // Error al obtener información del usuario
        return null;
      }
    } catch (error) {
      // Error al obtener información del usuario
      return null;
    }
  };

  // Función para iniciar sesión
  const login = async (usuario: string, password: string): Promise<boolean> => {
    try {
 
      
      const result = await apiLogin({ usuario, pswd: password })
      
      // Verificar el token sin mostrar logs de depuración
      if (result.token) {
        try {
          const tokenParts = result.token.split('.');
          if (tokenParts.length === 3) {
            // Decodificar el payload silenciosamente
            JSON.parse(atob(tokenParts[1]));
          }
        } catch (e) {
          // Error silencioso al decodificar
        }
      }
      
      // Guardar el token en localStorage, cookie y en el estado
      if (result.success && result.token) {
        
        localStorage.setItem("token", result.token)
        // Guardar en cookie para que el middleware pueda acceder
        document.cookie = `token=${result.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`
        setToken(result.token)
        setIsAuthenticated(true)
        
        // Obtener información completa del usuario
        const userInfo = await fetchUserInfo(usuario);
        if (userInfo) {
          setUser(userInfo);
        } else {
          setUser({ nombre: usuario }); // Fallback si no se puede obtener la información completa
        }
        
        return true;
      } else {
        // Login fallido
        return false
      }
    } catch (error) {
      // Error de autenticación
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
