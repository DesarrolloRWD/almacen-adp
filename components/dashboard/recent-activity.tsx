"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Pill, Stethoscope, Syringe } from "lucide-react"

// Definimos una interfaz para los datos que esperamos recibir de la API
interface MovimientoAPI {
  id: number
  fecha: string
  tipo: string
  producto: {
    codigo: string
    descripcion: string
  }
  cantidad: number
  caja: string
  area: string
  usuario: {
    nombre: string
    avatar?: string
    iniciales: string
    departamento?: string
  }
}

// Datos de respaldo en caso de que la API no esté disponible
const fallbackData = [
  {
    id: 1,
    user: {
      name: "Dr. Carlos Méndez",
      avatar: "",
      initials: "CM",
      department: "Cirugía",
    },
    action: "retiró",
    product: "Filtro de Aire A-123",
    quantity: 5,
    area: "Quirófano 2",
    timestamp: "Hace 10 minutos",
    type: "medical",
  },
  {
    id: 2,
    user: {
      name: "Dra. Laura Sánchez",
      avatar: "",
      initials: "LS",
      department: "Farmacia",
    },
    action: "registró",
    product: "Paracetamol 500mg",
    quantity: 200,
    area: "Farmacia Central",
    timestamp: "Hace 25 minutos",
    type: "medication",
  },
  {
    id: 3,
    user: {
      name: "Dr. Miguel Ángel",
      avatar: "",
      initials: "MA",
      department: "Emergencias",
    },
    action: "actualizó",
    product: "Jeringas desechables 5ml",
    quantity: 10,
    area: "Emergencias",
    timestamp: "Hace 1 hora",
    type: "surgical",
  },
  {
    id: 4,
    user: {
      name: "Dra. Ana Gómez",
      avatar: "",
      initials: "AG",
      department: "Pediatría",
    },
    action: "retiró",
    product: "Guantes estériles talla M",
    quantity: 15,
    area: "Pediatría",
    timestamp: "Hace 2 horas",
    type: "medical",
  },
]

const getTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "medicamento":
    case "medication":
      return <Pill className="h-4 w-4 text-blue-500" />
    case "quirurgico":
    case "surgical":
      return <Syringe className="h-4 w-4 text-purple-500" />
    default:
      return <Stethoscope className="h-4 w-4 text-green-500" />
  }
}

const getTipoMovimiento = (tipo: string) => {
  switch (tipo.toLowerCase()) {
    case "entrada":
      return "registró"
    case "salida":
      return "retiró"
    case "actualizacion":
      return "actualizó"
    default:
      return tipo
  }
}

const formatearFecha = (fecha: string) => {
  try {
    const date = new Date(fecha)
    const ahora = new Date()
    const diferencia = ahora.getTime() - date.getTime()
    
    // Menos de 1 hora
    if (diferencia < 60 * 60 * 1000) {
      const minutos = Math.floor(diferencia / (60 * 1000))
      return `Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
    }
    // Menos de 1 día
    else if (diferencia < 24 * 60 * 60 * 1000) {
      const horas = Math.floor(diferencia / (60 * 60 * 1000))
      return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`
    }
    // Más de 1 día
    else {
      const dias = Math.floor(diferencia / (24 * 60 * 60 * 1000))
      return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`
    }
  } catch (e) {
    return fecha
  }
}

export function RecentActivity() {
  const [activityData, setActivityData] = useState<MovimientoAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMovimientos() {
      try {
        // Ya no necesitamos obtener la URL del endpoint desde las variables de entorno
        // Usamos el endpoint local configurado en next.config.mjs
        
        // Establecer un timeout para la petición
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos de timeout
        
        // Usar el endpoint local configurado en next.config.mjs
        const response = await fetch('/api/productos/movimientos', {
          signal: controller.signal
        }).catch(error => {
          console.error('Error de conexión:', error)
          throw new Error('No se pudo conectar con el servidor')
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        
        const data = await response.json()
        setActivityData(data)
      } catch (err) {
        console.error('Error al obtener movimientos:', err)
        setError(`No se pudieron cargar los datos de actividad reciente: ${err instanceof Error ? err.message : 'Error desconocido'}`)
        // Usar datos de respaldo en caso de error
        // console.log('Usando datos de respaldo para movimientos')
        setActivityData(fallbackData as any)
      } finally {
        setLoading(false)
      }
    }

    fetchMovimientos()
  }, [])

  if (loading) {
    return <div className="py-4 text-center">Cargando actividad reciente...</div>
  }

  if (error && activityData.length === 0) {
    return <div className="py-4 text-center text-red-500">{error}</div>
  }

  return (
    <div className="space-y-5">
      {activityData.length === 0 ? (
        <div className="py-4 text-center text-muted-foreground">No hay actividad reciente para mostrar</div>
      ) : (
        activityData.map((item) => (
        <div key={item.id} className="flex items-start gap-4">
          <Avatar className="h-10 w-10 border-2 border-naval-100">
            <AvatarImage src={item.usuario.avatar || "/placeholder.svg"} alt={item.usuario.nombre} />
            <AvatarFallback className="bg-naval-100 text-naval-700">{item.usuario.iniciales}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">{item.usuario.nombre}</p>
              <Badge variant="outline" className="text-xs bg-naval-50 text-naval-700 border-naval-200">
                {item.usuario.departamento || "Hospital Naval"}
              </Badge>
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">{getTipoMovimiento(item.tipo)}</span>{" "}
              <span className="font-medium">{item.cantidad} unidades</span> de{" "}
              <span className="font-medium items-center gap-1 flex">
                {getTypeIcon(item.tipo)}
                {item.producto.descripcion}
              </span>
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{item.area}</span>
              <span>•</span>
              <span>{formatearFecha(item.fecha)}</span>
            </div>
          </div>
        </div>
      ))
      )}
    </div>
  )
}
