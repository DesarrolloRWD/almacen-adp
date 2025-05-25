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

// Definimos la interfaz para los productos
interface Producto {
  id?: number
  codigo: string
  descripcion: string
  catalogo: string
  unidad: string
  pzsPorUnidad: number
  piezas: number
  marca: string
  fechaExpiracion: string
  fechaIngreso?: string
  tipoMovimiento: string
  movimientoArea: string
  totalPiezas?: number
  estado?: string
}

// Datos de respaldo en caso de que la API no esté disponible
const productosRespaldo = [
  {
    id: 1,
    codigo: "INS-001",
    descripcion: "Guantes de Nitrilo Talla M",
    catalogo: "Protección",
    unidad: "Caja",
    pzsPorUnidad: 100,
    piezas: 50,
    marca: "MedGuard",
    fechaExpiracion: "2026-01-15",
    tipoMovimiento: "Entrada",
    movimientoArea: "Almacén Principal",
    estado: "normal",
  },
  {
    id: 2,
    codigo: "INS-002",
    descripcion: "Jeringas Desechables 5ml",
    catalogo: "Inyección",
    unidad: "Paquete",
    pzsPorUnidad: 50,
    piezas: 200,
    marca: "MediTech",
    fechaExpiracion: "2027-05-20",
    tipoMovimiento: "Entrada",
    movimientoArea: "Almacén Principal",
    estado: "normal",
  },
  {
    id: 3,
    codigo: "INS-003",
    descripcion: "Vendas Elásticas 10cm",
    catalogo: "Curación",
    unidad: "Rollo",
    pzsPorUnidad: 1,
    piezas: 75,
    marca: "HealFast",
    fechaExpiracion: "2025-08-10",
    tipoMovimiento: "Entrada",
    movimientoArea: "Emergencias",
    estado: "normal",
  },
  {
    id: 4,
    codigo: "INS-004",
    descripcion: "Mascarillas Quirúrgicas",
    catalogo: "Protección",
    unidad: "Caja",
    pzsPorUnidad: 50,
    piezas: 100,
    marca: "SafeBreath",
    fechaExpiracion: "2025-06-25",
    tipoMovimiento: "Entrada",
    movimientoArea: "Almacén Principal",
    estado: "porExpirar",
  },
  {
    id: 5,
    codigo: "INS-005",
    descripcion: "Batas Desechables",
    catalogo: "Protección",
    unidad: "Paquete",
    pzsPorUnidad: 10,
    piezas: 30,
    marca: "MedCover",
    fechaExpiracion: "2025-07-01",
    tipoMovimiento: "Entrada",
    movimientoArea: "Quirófano",
    estado: "porExpirar",
  },
]

export default function ProductosTable() {
  const [searchQuery, setSearchQuery] = useState("")
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editarDialogOpen, setEditarDialogOpen] = useState(false)
  const [activarDialogOpen, setActivarDialogOpen] = useState(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)

  // Función para obtener los productos de la API
  const fetchProductos = async () => {
    try {
      setLoading(true)
      // console.log('Obteniendo productos desde la API...')
      
      // Usar el proxy local para evitar problemas de CORS
      const response = await fetch('/api/get/productos')
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }
      
      const data = await response.json()
      // console.log('Productos obtenidos:', data)
      
      // Procesar los datos para agregar el estado basado en la fecha de expiración
      const productosConEstado = data.map((producto: Producto) => {
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
      // Usar datos de respaldo en caso de error
      // console.log('Usando datos de respaldo para productos')
      setProductos(productosRespaldo)
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
      producto.marca.toLowerCase().includes(searchQuery.toLowerCase()),
  )
  
  // Función para manejar la acción de editar un producto
  const handleEditarProducto = (producto: Producto) => {
    setProductoSeleccionado(producto)
    setEditarDialogOpen(true)
  }
  
  // Función para manejar la acción de activar un producto
  const handleActivarProducto = (producto: Producto) => {
    setProductoSeleccionado(producto)
    setActivarDialogOpen(true)
  }
  
  // Función para actualizar la lista de productos después de una edición o activación exitosa
  const handleSuccess = () => {
    // Recargar los productos desde la API
    fetchProductos()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por código, descripción o marca..."
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
                <TableHead className="text-naval-700">Catálogo</TableHead>
                <TableHead className="text-naval-700">Marca</TableHead>
                <TableHead className="text-naval-700">Unidad</TableHead>
                <TableHead className="text-naval-700">Piezas</TableHead>
                <TableHead className="text-naval-700">Fecha Exp.</TableHead>
                <TableHead className="text-right text-naval-700">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProductos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No se encontraron insumos médicos.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProductos.map((producto) => (
                  <TableRow key={producto.codigo} className="hover:bg-naval-50">
                    <TableCell className="font-medium">{producto.codigo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {producto.estado === "porExpirar" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        {producto.descripcion}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-naval-50 text-naval-700 border-naval-200">
                        {producto.catalogo}
                      </Badge>
                    </TableCell>
                    <TableCell>{producto.marca}</TableCell>
                    <TableCell>
                      {producto.unidad} ({producto.pzsPorUnidad} pzs)
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={producto.piezas < 30 ? "secondary" : "outline"}
                        className={
                          producto.piezas < 30
                            ? "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        }
                      >
                        {producto.piezas}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={producto.estado === "porExpirar" ? "text-amber-600 font-medium" : ""}>
                        {new Date(producto.fechaExpiracion).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-naval-600 hover:text-naval-700 hover:bg-naval-50"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditarProducto(producto)}>Editar insumo</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleActivarProducto(producto)}>Activar producto</DropdownMenuItem>
                          <DropdownMenuItem>Registrar salida</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {!loading && !error && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Mostrando <span className="font-medium">{filteredProductos.length}</span> de{" "}
            <span className="font-medium">{productos.length}</span> insumos
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-naval-600 hover:text-naval-700 hover:bg-naval-50"
              disabled
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-naval-600 hover:text-naval-700 hover:bg-naval-50"
              disabled
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-naval-600 hover:text-naval-700 hover:bg-naval-50"
              disabled
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-naval-600 hover:text-naval-700 hover:bg-naval-50"
              disabled
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Diálogo para editar productos */}
      <EditarProductoDialog
        producto={productoSeleccionado}
        open={editarDialogOpen}
        onOpenChange={setEditarDialogOpen}
        onSuccess={handleSuccess}
      />

      {/* Diálogo para activar productos */}
      <ActivarProductoDialog
        producto={productoSeleccionado}
        open={activarDialogOpen}
        onOpenChange={setActivarDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
