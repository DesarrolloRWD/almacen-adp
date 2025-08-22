"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  History,
  Home,
  Layers,
  PackageOpen,
  PlusCircle,
  Settings,
  ShieldAlert,
  Stethoscope,
  Warehouse,
} from "lucide-react"
import { getTenantFromToken } from "@/lib/jwt-utils"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

// Elementos de navegación para usuarios de almacén naval/balbuena
const navalNavItems: NavItem[] = [
  {
    title: "Verificar Remisiones",
    href: "/verificar/remisiones",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Insumos Médicos",
    href: "/productos",
    icon: <Stethoscope className="h-5 w-5" />,
  },
  {
    title: "Presentaciones",
    href: "/formatos",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    title: "Entregas",
    href: "/historial",
    icon: <History className="h-5 w-5" />,
  },
  {
    title: "Historial de Salidas",
    href: "/historial-salidas",
    icon: <PackageOpen className="h-5 w-5" />,
  },
  
]

// Elementos de navegación para usuarios de almacén general
const almacenGeneralNavItems: NavItem[] = [
  {
    title: "Inventario General",
    href: "/almacen-general",
    icon: <Warehouse className="h-5 w-5" />,
  },
  // {
  //   title: "Distribución",
  //   href: "/almacen-general/distribucion",
  //   icon: <PackageOpen className="h-5 w-5" />,
  // },
  {
    title: "Registrar Producto",
    href: "/almacen-general/registrar",
    icon: <PlusCircle className="h-5 w-5" />,
  },
  {
    title: "Carga Masiva",
    href: "/almacen-general/carga-masiva",
    icon: <FileSpreadsheet className="h-5 w-5" />,
  },
  {
    title: "Generar Remisión",
    href: "/almacen-general/remision",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Historial de remisiones",
    href: "/almacen-general/remision/listar",
    icon: <History className="h-5 w-5" />,
  },
  // {
  //   title: "Historial",
  //   href: "/almacen-general-historial",
  //   icon: <History className="h-5 w-5" />,
  // },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isAlmacenGeneral, setIsAlmacenGeneral] = useState(false)
  
  // Efecto para verificar el tipo de usuario al cargar el componente
  useEffect(() => {
    const checkUserType = () => {
      // Obtener el token directamente del localStorage
      const token = localStorage.getItem("token") || ""
      
      // Intentar decodificar el token manualmente para depuración
      let issFromManual = ""
      if (token) {
        try {
          const tokenParts = token.split('.')
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]))
            issFromManual = payload.iss || ""
          }
        } catch (e) {
        }
      }
      
      // Usar la función getTenantFromToken como respaldo
      const issValue = getTenantFromToken()
      
      // Usar el valor obtenido manualmente si está disponible, de lo contrario usar el de la función
      const finalIssValue = issFromManual || issValue
      
      // Si el iss corresponde al almacén general
      setIsAlmacenGeneral(finalIssValue === "38324f69-8b3b-41f0-949c-821a9534bba0")
    }
    
    checkUserType()
    
    // Agregar un listener para cambios en localStorage (por si el token cambia)
    const handleStorageChange = () => {
      checkUserType()
    }
    
    // Agregar un listener para cuando la ventana recupera el foco
    const handleFocus = () => {
      checkUserType()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])
  
  // Seleccionar los elementos de navegación según el tipo de usuario
  const navItemsToShow = isAlmacenGeneral ? almacenGeneralNavItems : navalNavItems

  return (
    <div className={cn("relative flex flex-col border-r bg-white shadow-sm", isCollapsed ? "w-16" : "w-64")}>
      <div className="flex h-16 items-center px-4 py-2 border-b bg-naval-600 text-white">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-6 w-6" />
            <span className="font-bold">
              {isAlmacenGeneral ? "Almacén General" : "Hospital Naval"}
            </span>
          </Link>
        )}
        {isCollapsed && (
          isAlmacenGeneral ? 
          <Warehouse className="h-6 w-6 mx-auto" /> : 
          <ShieldAlert className="h-6 w-6 mx-auto" />
        )}
      </div>
      <Button
        variant="outline"
        size="icon"
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-white shadow-md"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <ScrollArea className="flex-1">
        <nav className="grid gap-1 px-2 py-3">
          {navItemsToShow.map((item: NavItem, index: number) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-naval-50",
                pathname === item.href ? "bg-naval-100 text-naval-700 font-medium" : "text-muted-foreground",
                isCollapsed && "justify-center px-0",
              )}
            >
              {item.icon}
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t text-center text-xs text-muted-foreground">
        {!isCollapsed && (
          <div className={cn(
            "font-medium py-1 px-2 rounded",
            process.env.NEXT_PUBLIC_APP_ENV === 'production' 
              ? "bg-red-100 text-red-700"
              : process.env.NEXT_PUBLIC_APP_ENV === 'staging'
              ? "bg-yellow-100 text-yellow-700"
              : "bg-blue-100 text-blue-700"
          )}>
            {process.env.NEXT_PUBLIC_APP_ENV === 'production' ? 'PRODUCCIÓN' : 'DESARROLLO'}
            {isAlmacenGeneral && " - ALMACÉN GENERAL"}
          </div>
        )}
      </div>
    </div>
  )
}
