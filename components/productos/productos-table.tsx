"use client"

import { useState, useEffect, useLayoutEffect } from "react"
import { createPortal } from "react-dom"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertOctagon,
  Trash2,
} from "lucide-react"
import { EditarProductoDialog } from "./editar-producto-dialog"
import { EliminarProductoDialog } from "./eliminar-producto-dialog"
import { toast } from "sonner"

// Definimos las divisiones con sus colores correspondientes
const divisiones = [
  { value: "COAGULACIÓN", label: "COAGULACIÓN", color: "#40E0D0" },
  { value: "FRACCIONAMIENTO", label: "FRACCIONAMIENTO", color: "#87CEEB" },
  { value: "TOMA DE MUESTRA/SANGRADO", label: "TOMA DE MUESTRA/SANGRADO", color: "#FFD700" },
  { value: "INMUNOHEMATOLOGIA", label: "INMUNOHEMATOLOGIA", color: "#D3D3D3" },
  { value: "CONFIRMATORIAS", label: "CONFIRMATORIAS", color: "#FF9999" },
  // { value: "NAT", label: "NAT", color: "#FFA07A" },
  { value: "NAT PANTHER", label: "NAT PANTHER", color: "#A0522D" },
  { value: "HEMATOLOGÍA", label: "HEMATOLOGÍA", color: "#90EE90" },
  { value: "SEROLOGÍA", label: "SEROLOGÍA", color: "#6495ED" },
  { value: "BIOLOGIA MOLECULAR", label: "BIOLOGIA MOLECULAR", color: "#708090" },
  { value: "CITOMETRÍA", label: "CITOMETRÍA", color: "#DDA0DD" },
  { value: "LAVADO DE MATERIAL ", label: "LAVADO DE MATERIAL ", color: "#FF0000" },
  { value: "TERAPIA CELULAR", label: "TERAPIA CELULAR", color: "#212f3d" }
]

// Definimos la interfaz para los productos según la estructura de la API
interface ProductoAPI {
  id?: string
  codigo: string
  descripcion: string
  marca: string
  unidadBase: string
  division: string
  linea: string
  sublinea: string
  lote: string
  fechaExpiracion: string
  minimos: number
  maximos: number
  cantidadNeta: number
  creadoPor: string
  estado?: string
  estadoInventario?: string
}

// Interfaz para los componentes de diálogo - Ahora coincide con la estructura de la API
interface Producto {
  id?: string
  codigo: string
  descripcion: string
  marca: string
  unidadBase: string
  division: string
  linea: string
  sublinea: string
  lote: string
  fechaExpiracion: string
  minimos: number
  maximos: number
  cantidadNeta: number
  creadoPor: string
  estado?: string
  estadoInventario?: string
}

// Componente para la leyenda del semáforo
function LeyendaSemaforo() {
  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-2">
        <span className="font-medium">Fecha:</span>
        <div className="flex items-center gap-1">
          <AlertOctagon className="h-3 w-3 text-red-600" />
          <span>Expirado</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-amber-600" />
          <span>Por expirar</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-600" />
          <span>Disponible</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium">Stock:</span>
        <div className="flex items-center gap-1">
          <AlertOctagon className="h-3 w-3 text-red-600" />
          <span>Mínimo</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-amber-600" />
          <span>Cerca del mínimo</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-600" />
          <span>Normal</span>
        </div>
      </div>
    </div>
  )
}

export default function ProductosTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [productos, setProductos] = useState<ProductoAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editarDialogOpen, setEditarDialogOpen] = useState(false)
  const [eliminarDialogOpen, setEliminarDialogOpen] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [leyendaPortalElement, setLeyendaPortalElement] = useState<HTMLElement | null>(null)
  
  // Efecto para encontrar el elemento donde renderizar el semáforo
  useEffect(() => {
    const leyendaElement = document.getElementById('leyenda-semaforo')
    if (leyendaElement) {
      setLeyendaPortalElement(leyendaElement)
    }
  }, [])

  // Función para obtener los productos de la API usando el proxy local
  const fetchProductos = async () => {
    try {
      setLoading(true)
      
      // Usamos el endpoint proxy local para evitar problemas de CORS
      const apiUrl = '/api/get/productos'
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Verificar si hay datos y si es un array
      if (!data || !Array.isArray(data)) {
        console.error('Formato de datos inesperado:', data)
        throw new Error('Formato de datos inesperado')
      }
      
      //////console.log('Datos recibidos:', data.length, 'productos')
      
      // Procesar los datos para agregar el estado basado en la fecha de expiración y nivel de inventario
      const productosConEstado = data.map((producto: ProductoAPI) => {
        // Extraer la fecha sin la hora para evitar problemas de zona horaria
        const fechaStr = producto.fechaExpiracion.split('T')[0];
        const [año, mes, día] = fechaStr.split('-');
        // Crear fecha de expiración sin ajuste de zona horaria
        const fechaExp = new Date(parseInt(año), parseInt(mes)-1, parseInt(día));
        
        // Obtener fecha actual sin componente de hora
        const hoyStr = new Date().toISOString().split('T')[0];
        const [añoHoy, mesHoy, díaHoy] = hoyStr.split('-');
        const hoy = new Date(parseInt(añoHoy), parseInt(mesHoy)-1, parseInt(díaHoy));
        
        // Calcular diferencia en días
        const diferenciaDias = Math.ceil((fechaExp.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
        
        // Determinar el estado basado en la fecha de expiración
        let estado = diferenciaDias <= 0 ? 'expirado' : diferenciaDias <= 30 ? 'porExpirar' : 'normal';
        
        // Determinar el estado de inventario
        let estadoInventario = 'normal';
        if (producto.cantidadNeta <= producto.minimos) {
          estadoInventario = 'minimo';
        } else if (producto.cantidadNeta <= producto.minimos * 1.2) {
          // Si está dentro del 20% por encima del mínimo, considerarlo "por llegar al mínimo"
          estadoInventario = 'porLlegarAlMinimo';
        }
        
        return {
          ...producto,
          estado,
          estadoInventario
        }
      })
      
      setProductos(productosConEstado)
    } catch (err) {
      console.error('Error al obtener productos:', err)
      setError(`No se pudieron cargar los productos: ${err instanceof Error ? err.message : 'Error desconocido'}`)
      setProductos([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar los productos al montar el componente
  useEffect(() => {
    fetchProductos()
  }, [])

  // Filtrar productos basados en la búsqueda
  const filteredProductos = productos.filter(
    (producto) =>
      producto.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      producto.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      producto.marca.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (producto.division && producto.division.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  
  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredProductos.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage)
  
  // Función para manejar la acción de editar un producto
  const handleEditarProducto = (productoAPI: ProductoAPI) => {
    // Pasar directamente el producto de la API al diálogo de edición
    // ya que ahora el formulario espera la misma estructura que la API
    setProductoSeleccionado(productoAPI as unknown as Producto)
    setEditarDialogOpen(true)
  }
  
  // Función para manejar la acción de abrir el diálogo de eliminación
  const handleAbrirEliminarProducto = (productoAPI: ProductoAPI) => {
    if (!productoAPI.id) {
      toast.error("No se puede eliminar el producto: ID no disponible")
      return
    }
    
    // Pasar el producto al diálogo de eliminación
    setProductoAEliminar(productoAPI as unknown as Producto)
    setEliminarDialogOpen(true)
  }
  
  // Función para actualizar la lista de productos después de una edición o activación exitosa
  const handleSuccess = () => {
    // Recargar los productos desde la API
    fetchProductos()
  }
  
  // Funciones para la paginación
  const goToFirstPage = () => {
    setCurrentPage(1)
  }
  
  const goToLastPage = () => {
    setCurrentPage(totalPages)
  }
  
  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }
  
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  return (
    <div className="space-y-4">
      {/* Renderizar el semáforo en el portal */}
      {leyendaPortalElement && createPortal(
        <LeyendaSemaforo />,
        leyendaPortalElement
      )}
      
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por código, descripción, marca o división..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-naval-500 border-r-transparent"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando productos...</p>
        </div>
      ) : error && productos.length === 0 ? (
        <div className="py-8 text-center text-red-500">
          <p>{error}</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader className="bg-naval-50">
              <TableRow>
                <TableHead className="text-naval-700 w-20">Código</TableHead>
                <TableHead className="text-naval-700 w-20">Lote</TableHead>
                <TableHead className="text-naval-700 w-32">Descripción</TableHead>
                <TableHead className="text-naval-700 w-24">División</TableHead>
                <TableHead className="text-naval-700 w-20">Unidad</TableHead>
                <TableHead className="text-naval-700 w-16">Mín</TableHead>
                <TableHead className="text-naval-700 w-16">Cant</TableHead>
                <TableHead className="text-naval-700 w-20">Marca</TableHead>
                <TableHead className="text-naval-700 w-20">Fecha</TableHead>
                <TableHead className="text-naval-700 w-24 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center">
                    No se encontraron insumos médicos.
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((producto, index) => (
                  <TableRow key={`${producto.codigo}-${producto.lote || 'sin-lote'}-${index}`} className="hover:bg-naval-50">
                    <TableCell className="font-medium">{producto.codigo}</TableCell>
                    <TableCell>{producto.lote || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {producto.descripcion}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ 
                            backgroundColor: divisiones.find(d => d.value === producto.division)?.color || "#cccccc" 
                          }}
                        />
                        <span>{producto.division}</span>
                      </div>
                    </TableCell>
                    <TableCell>{producto.unidadBase}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {producto.estadoInventario === "minimo" ? (
                          <>
                            <AlertOctagon className="h-4 w-4 text-red-600" />
                            <span className="text-red-600 font-medium">
                              {producto.minimos}
                            </span>
                          </>
                        ) : producto.estadoInventario === "porLlegarAlMinimo" ? (
                          <>
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <span className="text-amber-600 font-medium">
                              {producto.minimos}
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">
                              {producto.minimos}
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={producto.estadoInventario === "minimo" ? "text-red-600 font-medium" : 
                                       producto.estadoInventario === "porLlegarAlMinimo" ? "text-amber-600 font-medium" : 
                                       "text-green-600"}>
                        {producto.cantidadNeta}
                      </span>
                    </TableCell>
                    <TableCell>{producto.marca}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {producto.estado === "expirado" ? (
                          <>
                            <AlertOctagon className="h-4 w-4 text-red-600" />
                            <span className="text-red-600">
                              {(() => {
                                // Extraer solo la fecha sin la hora para evitar problemas de zona horaria
                                const fechaStr = producto.fechaExpiracion.split('T')[0];
                                // Crear la fecha usando año, mes y día explícitamente para evitar ajustes de zona horaria
                                const [año, mes, día] = fechaStr.split('-');
                                // Crear una fecha local con esos componentes (mes-1 porque en JS los meses van de 0-11)
                                const fecha = new Date(parseInt(año), parseInt(mes)-1, parseInt(día));
                                return fecha.toLocaleDateString();
                              })()}
                            </span>
                          </>
                        ) : producto.estado === "porExpirar" ? (
                          <>
                            <Clock className="h-4 w-4 text-amber-600" />
                            <span className="text-amber-600">
                              {(() => {
                                const fechaStr = producto.fechaExpiracion.split('T')[0];
                                const [año, mes, día] = fechaStr.split('-');
                                const fecha = new Date(parseInt(año), parseInt(mes)-1, parseInt(día));
                                return fecha.toLocaleDateString();
                              })()}
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">
                              {(() => {
                                const fechaStr = producto.fechaExpiracion.split('T')[0];
                                const [año, mes, día] = fechaStr.split('-');
                                const fecha = new Date(parseInt(año), parseInt(mes)-1, parseInt(día));
                                return fecha.toLocaleDateString();
                              })()}
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleAbrirEliminarProducto(producto)}
                          title="Eliminar producto"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar producto</span>
                        </Button>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditarProducto(producto)}>
                              Editar producto
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Paginación */}
          {filteredProductos.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredProductos.length)} de {filteredProductos.length} productos
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {productoSeleccionado && (
        <EditarProductoDialog
          producto={productoSeleccionado}
          open={editarDialogOpen}
          onOpenChange={setEditarDialogOpen}
          onSuccess={handleSuccess}
        />
      )}
      
      {productoAEliminar && (
        <EliminarProductoDialog
          producto={productoAEliminar}
          open={eliminarDialogOpen}
          onOpenChange={setEliminarDialogOpen}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}