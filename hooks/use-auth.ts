"use client"

import { useState, useEffect } from "react"
import { getTenantFromToken } from "@/lib/jwt-utils"

export function useAuth() {
  const [token, setToken] = useState<string>("")
  const [issValue, setIssValue] = useState<string>("")
  
  useEffect(() => {
    // Obtener el token del localStorage
    const storedToken = localStorage.getItem("token") || ""
    setToken(storedToken)
    
    // Obtener el valor del tenant (iss) del token
    const tenant = getTenantFromToken()
    setIssValue(tenant)
    
    // Listener para cambios en el localStorage
    const handleStorageChange = () => {
      const updatedToken = localStorage.getItem("token") || ""
      setToken(updatedToken)
      const updatedTenant = getTenantFromToken()
      setIssValue(updatedTenant)
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])
  
  return { token, issValue }
}
