"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { PackageOpen, AlertTriangle, CheckCircle } from "lucide-react"

// Definimos una interfaz para los datos que esperamos recibir de la API
interface CajaAPI {
  id: string
  codigo: string
  nombre: string
  capacidad: number
  usado: number
  area: string
  fechaApertura: string
  responsable: string
  estado: string
  productos: {
    codigo: string
    nombre: string
    cantidad: number
  }[]
}

// Datos de respaldo en caso de que la API no esté disponible
const fallbackData = [
  {
    id: "box-1",
    name: "Lote A-123",
    capacity: 100,
    used: 78,
    area: "Farmacia",
    status: "En uso",
    type: "Medicamentos",
  },
  {
    id: "box-2",
    name: "Lote B-456",
    capacity: 100,
    used: 100,
    area: "Almacén Principal",
    status: "Completo",
    type: "Material Quirúrgico",
  },
  {
    id: "box-3",
    name: "Lote C-789",
    capacity: 100,
    used: 23,
    area: "Emergencias",
    status: "En uso",
    type: "Insumos Médicos",
  },
]

export function BoxStatus() {
  const [boxesData, setBoxesData] = useState<CajaAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCajas() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''
        if (!apiUrl) {
          throw new Error('URL de API no configurada')
        }
        
        console.log('Intentando conectar a:', `${apiUrl}/api/get/cajas`)
        
        // Establecer un timeout para la petición
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos de timeout
        
        const response = await fetch(`${apiUrl}/api/get/cajas`, {
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
        setBoxesData(data)
      } catch (err) {
        console.error('Error al obtener cajas:', err)
        setError(`No se pudieron cargar los datos de lotes: ${err instanceof Error ? err.message : 'Error desconocido'}`)
        // Usar datos de respaldo en caso de error
        console.log('Usando datos de respaldo para cajas')
        setBoxesData(fallbackData as any)
      } finally {
        setLoading(false)
      }
    }

    fetchCajas()
  }, [])

  if (loading) {
    return <div className="py-4 text-center">Cargando estado de lotes...</div>
  }

  if (error && boxesData.length === 0) {
    return <div className="py-4 text-center text-red-500">{error}</div>
  }

  return (
    <div className="space-y-5">
      {boxesData.length === 0 ? (
        <div className="py-4 text-center text-muted-foreground">No hay lotes para mostrar</div>
      ) : (
        boxesData.map((box) => (
        <div key={box.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageOpen className={`h-4 w-4 ${box.usado === box.capacidad ? "text-amber-500" : "text-naval-500"}`} />
              <div>
                <p className="text-sm font-medium flex items-center">
                  {box.nombre}
                  {box.usado === box.capacidad && (
                    <Badge className="ml-2 bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200">
                      Completo
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {box.area} • {getTipoLote(box.estado)}
                </p>
              </div>
            </div>
            <p className="text-sm font-medium">
              {box.usado}/{box.capacidad}
            </p>
          </div>
          <Progress
            value={(box.usado / box.capacidad) * 100}
            className={`h-2 ${box.usado === box.capacidad ? "[&>div]:bg-amber-500" : "[&>div]:bg-naval-500"}`}
          />
          <div className="flex justify-end">
            {box.usado === box.capacidad ? (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Requiere reemplazo
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                <CheckCircle className="mr-1 h-3 w-3" />
                Disponible
              </Badge>
            )}
          </div>
        </div>
      ))
      )}
    </div>
  )
}

function getTipoLote(estado: string): string {
  switch (estado.toLowerCase()) {
    case "activo":
      return "Medicamentos"
    case "completo":
      return "Material Quirúrgico"
    case "en_uso":
    case "en uso":
      return "Insumos Médicos"
    default:
      return estado
  }
}
