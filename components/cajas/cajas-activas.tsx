"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Package, PackageOpen, AlertTriangle, Clock, CheckCircle2, Loader2, Send } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import EntregarProductoDialog from "./entregar-producto-dialog"

// Interfaz para los productos activos
interface ProductoActivo {
  codigo: string
  unidad: string
  fechaInicio: string
  piezasComienzo: number | null
  piezasEntregadas: number | null
  entregadaPor: string | null
  recibidaPor: string | null
  fechaEntrega: string | null
  piezasRestantes: number | null
  nombre?: string // Agregamos este campo para mostrar información más amigable
  capacidad?: number // Capacidad total del lote
}

// Datos de respaldo en caso de que la API no esté disponible
const productosActivosRespaldo: ProductoActivo[] = [
  {
    codigo: "PRU-001",
    unidad: "CAJA2X 6PBAS",
    fechaInicio: "2025-05-19T04:46:19.000+00:00",
    piezasComienzo: 100,
    piezasEntregadas: 20,
    entregadaPor: "Dr. Carlos Méndez",
    recibidaPor: "Dra. Laura Sánchez",
    fechaEntrega: "2025-05-19T05:00:00.000+00:00",
    piezasRestantes: 80,
    nombre: "Guantes de Nitrilo Talla M",
    capacidad: 100
  },
  {
    codigo: "PRU-002",
    unidad: "CAJA C/48 PBAS",
    fechaInicio: "2025-05-18T14:30:00.000+00:00",
    piezasComienzo: 48,
    piezasEntregadas: 12,
    entregadaPor: "Dr. Miguel Ángel",
    recibidaPor: "Dra. Ana Martínez",
    fechaEntrega: "2025-05-18T15:15:00.000+00:00",
    piezasRestantes: 36,
    nombre: "Jeringas Desechables 5ml",
    capacidad: 48
  },
  {
    codigo: "PRU-003",
    unidad: "CAJA C/24 PBAS",
    fechaInicio: "2025-05-17T09:20:00.000+00:00",
    piezasComienzo: 24,
    piezasEntregadas: 24,
    entregadaPor: "Dra. Laura Sánchez",
    recibidaPor: "Dr. Roberto García",
    fechaEntrega: "2025-05-17T10:00:00.000+00:00",
    piezasRestantes: 0,
    nombre: "Vendas Elásticas 10cm",
    capacidad: 24
  }
]

export default function CajasActivas() {
  const [productosActivos, setProductosActivos] = useState<ProductoActivo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState<string | null>(null)
  const [entregarDialogOpen, setEntregarDialogOpen] = useState(false)
  const [productoParaEntregar, setProductoParaEntregar] = useState<ProductoActivo | null>(null)

  // Función para obtener los productos activos de la API
  useEffect(() => {
    const fetchProductosActivos = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Configuramos un timeout para la petición
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 segundos de timeout
        
        // console.log('Obteniendo productos activos de la API...')
        
        // Intentamos obtener los datos de la API usando la URL correcta
        const response = await fetch('/api/get/productos/activos', {
          method: 'GET', // Usamos GET ya que POST no está permitido
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          console.error(`Error HTTP: ${response.status} - ${response.statusText}`)
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        // console.log('Respuesta recibida correctamente')
        const data = await response.json()
        // console.log('Datos recibidos:', data)
        
        // Procesamos los datos recibidos
        let productosFormateados: ProductoActivo[] = []
        
        if (Array.isArray(data)) {
          // Si los datos son un array, los procesamos directamente
          productosFormateados = data.map((producto: any) => ({
            ...producto,
            nombre: producto.nombre || producto.descripcion || `Producto ${producto.codigo}`,
            capacidad: producto.capacidad || producto.piezasComienzo || 100
          }))
        } else if (typeof data === 'object' && data !== null) {
          // Si los datos son un objeto, intentamos extraer el array
          const extractedData = data.data || data.productos || data.items || data.results || []
          if (Array.isArray(extractedData)) {
            productosFormateados = extractedData.map((producto: any) => ({
              ...producto,
              nombre: producto.nombre || producto.descripcion || `Producto ${producto.codigo}`,
              capacidad: producto.capacidad || producto.piezasComienzo || 100
            }))
          }
        }
        
        // console.log('Productos procesados:', productosFormateados)
        
        if (productosFormateados.length > 0) {
          setProductosActivos(productosFormateados)
        } else {
          // console.log('No se encontraron productos activos en la API, mostrando datos de respaldo')
          setProductosActivos(productosActivosRespaldo)
          toast({
            title: 'Sin productos activos',
            description: 'No se encontraron productos activos en la base de datos.',
            variant: 'default',
          })
        }
      } catch (err) {
        console.error('Error al obtener productos activos:', err)
        setError('No se pudieron cargar los productos activos. Usando datos de respaldo.')
        setProductosActivos(productosActivosRespaldo)
        toast({
          title: 'Error de conexión',
          description: 'No se pudieron cargar los productos activos de la base de datos. Mostrando datos de ejemplo.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchProductosActivos()
  }, [])
  
  // Función para cerrar un producto activo
  const cerrarProductoActivo = async (codigo: string) => {
    try {
      console.log(`Cerrando producto activo: ${codigo}`)
      toast({
        title: "Producto cerrado",
        description: `El producto ${codigo} ha sido cerrado correctamente.`,
      })
      
      // Aquí iría la lógica para cerrar el producto en la API
      // Por ahora, simplemente actualizamos el estado local
      setProductosActivos(prev => prev.filter(p => p.codigo !== codigo))
      
    } catch (error) {
      console.error('Error al cerrar producto activo:', error)
      toast({
        title: "Error",
        description: "No se pudo cerrar el producto activo. Inténtelo de nuevo más tarde.",
        variant: "destructive",
      })
    }
  }
  
  // Función para abrir el diálogo de entrega de productos
  const abrirDialogoEntrega = (producto: ProductoActivo) => {
    setProductoParaEntregar(producto)
    setEntregarDialogOpen(true)
  }
  
  // Función que se ejecuta después de entregar un producto
  const handleEntregaCompletada = () => {
    // Refrescar la lista de productos activos
    const fetchProductosActivos = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Configuramos un timeout para la petición
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 segundos de timeout
        
        // console.log('Obteniendo productos activos de la API...')
        
        // Intentamos obtener los datos de la API usando la URL correcta
        const response = await fetch('/api/get/productos/activos', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          console.error(`Error HTTP: ${response.status} - ${response.statusText}`)
          throw new Error(`Error ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Procesamos los datos recibidos
        let productosFormateados: ProductoActivo[] = []
        
        if (Array.isArray(data)) {
          productosFormateados = data.map((producto: any) => ({
            ...producto,
            nombre: producto.nombre || producto.descripcion || `Producto ${producto.codigo}`,
            capacidad: producto.capacidad || producto.piezasComienzo || 100
          }))
        } else if (typeof data === 'object' && data !== null) {
          const extractedData = data.data || data.productos || data.items || data.results || []
          if (Array.isArray(extractedData)) {
            productosFormateados = extractedData.map((producto: any) => ({
              ...producto,
              nombre: producto.nombre || producto.descripcion || `Producto ${producto.codigo}`,
              capacidad: producto.capacidad || producto.piezasComienzo || 100
            }))
          }
        }
        
        if (productosFormateados.length > 0) {
          setProductosActivos(productosFormateados)
        } else {
          // console.log('No se encontraron productos activos en la API, mostrando datos de respaldo')
          setProductosActivos(productosActivosRespaldo)
        }
      } catch (err) {
        console.error('Error al obtener productos activos:', err)
        setError('No se pudieron cargar los productos activos. Usando datos de respaldo.')
        setProductosActivos(productosActivosRespaldo)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProductosActivos()
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-naval-600" />
          <span className="ml-3 text-naval-700">Cargando productos activos...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-medium text-naval-800 mb-2">Error al cargar productos activos</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
        </div>
      ) : productosActivos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-naval-400 mb-4" />
          <h3 className="text-lg font-medium text-naval-800 mb-2">No hay productos activos</h3>
          <p className="text-sm text-muted-foreground">Actualmente no hay productos activados en el sistema.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {productosActivos.map((producto) => {
            // Calculamos el porcentaje de piezas entregadas
            const piezasEntregadas = producto.piezasEntregadas || 0;
            const piezasTotales = producto.piezasComienzo || producto.capacidad || 100;
            const porcentajeEntregado = (piezasEntregadas / piezasTotales) * 100;
            const piezasRestantes = producto.piezasRestantes !== null ? producto.piezasRestantes : (piezasTotales - piezasEntregadas);
            const estaCompleto = piezasRestantes <= 0;
            
            return (
              <Card
                key={producto.codigo}
                className={`naval-card ${estaCompleto ? "border-amber-300" : "border-naval-200"}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-naval-800">{producto.nombre || `Producto ${producto.codigo}`}</CardTitle>
                    <Badge
                      variant={!estaCompleto ? "outline" : "secondary"}
                      className={
                        !estaCompleto
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }
                    >
                      {!estaCompleto ? (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      ) : (
                        <AlertTriangle className="mr-1 h-3 w-3" />
                      )}
                      {!estaCompleto ? "En uso" : "Completo"}
                    </Badge>
                  </div>
                  <CardDescription>Código: {producto.codigo}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Piezas entregadas</span>
                        <span className="font-medium">
                          {piezasEntregadas}/{piezasTotales}
                        </span>
                      </div>
                      <Progress
                        value={porcentajeEntregado}
                        className={`h-2 ${estaCompleto ? "bg-amber-100" : "bg-naval-100"}`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Unidad</p>
                        <p className="font-medium text-naval-700">{producto.unidad}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fecha Inicio</p>
                        <p className="font-medium text-naval-700 flex items-center">
                          <Clock className="mr-1 h-3 w-3 text-naval-500" />
                          {new Date(producto.fechaInicio).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Activado por</p>
                        <p className="font-medium text-naval-700">{producto.entregadaPor || "No especificado"}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Estado</p>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-naval-700">Piezas restantes</span>
                          <span className="font-medium text-naval-700">{piezasRestantes}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex w-full justify-between">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800"
                      >
                        Ver Detalles
                      </Button>
                      
                      {!estaCompleto && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                          onClick={() => abrirDialogoEntrega(producto)}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Entregar
                        </Button>
                      )}
                    </div>

                    {estaCompleto ? (
                      <AlertDialog open={dialogOpen && selectedProducto === producto.codigo} onOpenChange={setDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setSelectedProducto(producto.codigo)}
                            className="bg-naval-600 hover:bg-naval-700"
                          >
                            <PackageOpen className="mr-2 h-4 w-4" />
                            Activar Nuevo
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center text-naval-800">
                              <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                              Confirmar activación de nuevo lote
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              El producto actual ({producto.codigo}) está completo. ¿Desea activar un nuevo lote para este
                              producto?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800">
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => cerrarProductoActivo(producto.codigo)}
                              className="bg-naval-600 hover:bg-naval-700"
                            >
                              Confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800 cursor-not-allowed opacity-70"
                      >
                        <Package className="mr-2 h-4 w-4" />
                        En Uso
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Diálogo para entregar productos */}
      {productoParaEntregar && (
        <EntregarProductoDialog
          open={entregarDialogOpen}
          onOpenChange={setEntregarDialogOpen}
          producto={{
            codigo: productoParaEntregar.codigo,
            descripcion: productoParaEntregar.nombre,
            unidad: productoParaEntregar.unidad,
            piezasRestantes: productoParaEntregar.piezasRestantes || 0
          }}
          onEntregarProducto={handleEntregaCompletada}
        />
      )}
    </div>
  )
}
