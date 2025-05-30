"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { EditarProductoDialog } from "./editar-producto-dialog"
import { ActivarProductoDialog } from "./activar-producto-dialog"

// Definimos la interfaz para los productos según la estructura de la API
interface ProductoAPI {
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
}

// Interfaz para los componentes de diálogo - Ahora coincide con la estructura de la API
interface Producto {
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
}

export default function ProductosTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [productos, setProductos] = useState<ProductoAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editarDialogOpen, setEditarDialogOpen] = useState(false)
  const [activarDialogOpen, setActivarDialogOpen] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

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
      
      ////console.log('Datos recibidos:', data.length, 'productos')
      
      // Procesar los datos para agregar el estado basado en la fecha de expiración
      const productosConEstado = data.map((producto: ProductoAPI) => {
        const fechaExp = new Date(producto.fechaExpiracion)
        const hoy = new Date()
        const diferenciaDias = Math.ceil((fechaExp.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
        
        return {
          ...producto,
          estado: diferenciaDias <= 30 ? 'porExpirar' : 'normal'
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
    ////console.log('Editando producto:', productoAPI)
    setProductoSeleccionado(productoAPI as unknown as Producto)
    setEditarDialogOpen(true)
  }
  
  // Función para manejar la acción de activar un producto
  const handleActivarProducto = (productoAPI: ProductoAPI) => {
    // Pasar directamente el producto de la API al diálogo de activación
    // ya que ahora el formulario espera la misma estructura que la API
    ////console.log('Activando producto:', productoAPI)
    setProductoSeleccionado(productoAPI as unknown as Producto)
    setActivarDialogOpen(true)
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
                <TableHead className="text-naval-700">Código</TableHead>
                <TableHead className="text-naval-700">Descripción</TableHead>
                <TableHead className="text-naval-700">División</TableHead>
                <TableHead className="text-naval-700">Unidad Base</TableHead>
                <TableHead className="text-naval-700">Mínimos</TableHead>
                <TableHead className="text-naval-700">Cantidad Neta</TableHead>
                <TableHead className="text-naval-700">Marca</TableHead>
                <TableHead className="text-naval-700">Fecha Exp.</TableHead>
                <TableHead className="text-naval-700">Estado</TableHead>
                <TableHead className="text-right text-naval-700">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    No se encontraron insumos médicos.
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((producto) => (
                  <TableRow key={producto.codigo} className="hover:bg-naval-50">
                    <TableCell className="font-medium">{producto.codigo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {producto.estado === "porExpirar" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        {producto.descripcion}
                      </div>
                    </TableCell>
                    <TableCell>{producto.division}</TableCell>
                    <TableCell>{producto.unidadBase}</TableCell>
                    <TableCell>{producto.minimos}</TableCell>
                    <TableCell>{producto.cantidadNeta}</TableCell>
                    <TableCell>{producto.marca}</TableCell>
                    <TableCell>
                      {new Date(producto.fechaExpiracion).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {producto.estado === "porExpirar" ? (
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                          Por Expirar
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Normal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
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
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleActivarProducto(producto)}>
                            Activar producto
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        <>
          <EditarProductoDialog
            producto={productoSeleccionado}
            open={editarDialogOpen}
            onOpenChange={setEditarDialogOpen}
            onSuccess={handleSuccess}
          />
          <ActivarProductoDialog
            producto={productoSeleccionado}
            open={activarDialogOpen}
            onOpenChange={setActivarDialogOpen}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </div>
  )
}