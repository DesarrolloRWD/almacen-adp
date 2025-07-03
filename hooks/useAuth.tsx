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
      
      // Intentar obtener el nombre de usuario del token JWT
      let username = "";
      try {
        const base64Url = token.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const payload = JSON.parse(jsonPayload);
          username = payload.sub || payload.usuario || "";
        }
      } catch (e) {
        console.error("Error al decodificar el token JWT", e);
      }
      
      // Si tenemos un nombre de usuario, obtener información completa
      if (username) {
        fetchUserInfo(username).then(userInfo => {
          if (userInfo) {
            setUser(userInfo);
          } else {
            setUser({ nombre: username }); // Fallback
          }
        });
      } else {
        setUser({ nombre: "Usuario" }); // Placeholder
      }
      
      // Asegurar que el token esté en ambos lugares
      if (!storedToken && cookieToken) {
        localStorage.setItem("token", cookieToken)
      } else if (storedToken && !cookieToken) {
        document.cookie = `token=${storedToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`
      }
    }
    
    setIsLoading(false)
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
        console.error('Error al obtener información del usuario, status:', response.status);
        return null;
      }
    } catch (error) {
      console.error("Error al obtener información del usuario:", error);
      return null;
    }
  };

  // Función para iniciar sesión
  const login = async (usuario: string, password: string): Promise<boolean> => {
    try {
 
      
      const result = await apiLogin({ usuario, pswd: password })
      
    
      
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
