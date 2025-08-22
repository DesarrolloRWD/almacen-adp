"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Edit, QrCode, Eye } from "lucide-react"
import { ProductoZoques, getProductosZoques, DetalleProductoRequest } from "@/lib/api"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ProductoDetalleDialog from "./producto-detalle-dialog"
import ProductoQRDialog from "./producto-qr-dialog"
import ProductoActualizarDialog from "./producto-actualizar-dialog"

export default function ProductosZoquesTable() {
  const [productos, setProductos] = useState<ProductoZoques[]>([])
  const [filteredProductos, setFilteredProductos] = useState<ProductoZoques[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para los diálogos
  const [selectedProducto, setSelectedProducto] = useState<ProductoZoques | null>(null)
  const [isDetalleOpen, setIsDetalleOpen] = useState(false)
  const [isQROpen, setIsQROpen] = useState(false)
  const [isActualizarOpen, setIsActualizarOpen] = useState(false)

  // Función para ordenar productos por fecha de creación (más recientes primero)
  const sortProductosByDate = (productos: ProductoZoques[]) => {
    return [...productos].sort((a, b) => {
      const dateA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0
      const dateB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0
      return dateB - dateA // Orden descendente (más recientes primero)
    })
  }

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setIsLoading(true)
        const data = await getProductosZoques()
        const sortedData = sortProductosByDate(data)
        setProductos(sortedData)
        setFilteredProductos(sortedData)
        setIsLoading(false)
      } catch (err) {
        console.error("[Zoques][Table] Error al cargar productos:", 
          err instanceof Error ? err.message : String(err))
        setError("Error al cargar los productos. Por favor, intente de nuevo más tarde.")
        setIsLoading(false)
      }
    }

    fetchProductos()
  }, [])
  
  // Función para refrescar los datos después de una actualización
  const refreshData = async () => {
    try {
      const data = await getProductosZoques()
      const sortedData = sortProductosByDate(data)
      setProductos(sortedData)
      setFilteredProductos(sortedData)
    } catch (err) {
      console.error("[Zoques][Table] Error al refrescar productos:", 
        err instanceof Error ? err.message : String(err))
    }
  }

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProductos(productos)
      return
    }

    const searchTermLower = searchTerm.toLowerCase()
    const filtered = productos.filter(
      (producto) =>
        (producto.codigo ? producto.codigo.toLowerCase().includes(searchTermLower) : false) ||
        (producto.descripcion ? producto.descripcion.toLowerCase().includes(searchTermLower) : false) ||
        (producto.marca ? producto.marca.toLowerCase().includes(searchTermLower) : false) ||
        (producto.division ? producto.division.toLowerCase().includes(searchTermLower) : false) ||
        (producto.linea ? producto.linea.toLowerCase().includes(searchTermLower) : false) ||
        (producto.sublinea ? producto.sublinea.toLowerCase().includes(searchTermLower) : false) ||
        (producto.temperatura ? producto.temperatura.toLowerCase().includes(searchTermLower) : false) ||
        (producto.lote ? producto.lote.toLowerCase().includes(searchTermLower) : false)
    )
    setFilteredProductos(filtered)
  }, [searchTerm, productos])

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-'
    
    try {
      const date = new Date(dateString)
      return format(date, "dd/MM/yyyy", { locale: es })
    } catch (error) {
      return dateString || '-'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center border rounded-md px-3 py-2 bg-white">
        <Search className="h-4 w-4 text-muted-foreground mr-2" />
        <Input
          placeholder="Buscar por código, descripción, marca..."
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 text-center text-red-500">{error}</div>
      ) : filteredProductos.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          {searchTerm.trim() !== "" ? "No se encontraron productos que coincidan con la búsqueda." : "No hay productos disponibles."}
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-naval-50">
              <TableRow>
                <TableHead className="text-naval-800">Código</TableHead>
                <TableHead className="text-naval-800">Descripción</TableHead>
                <TableHead className="text-naval-800">Marca</TableHead>
                <TableHead className="text-naval-800">División</TableHead>
                <TableHead className="text-naval-800">Línea</TableHead>
                <TableHead className="text-naval-800">Sublínea</TableHead>
                <TableHead className="text-naval-800">Temperatura</TableHead>
                <TableHead className="text-naval-800">Unidad</TableHead>
                <TableHead className="text-naval-800">Lote</TableHead>
                <TableHead className="text-naval-800">Fecha Creación</TableHead>
                <TableHead className="text-naval-800">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProductos.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell className="font-medium">{producto.codigo || '-'}</TableCell>
                  <TableCell>{producto.descripcion || '-'}</TableCell>
                  <TableCell>{producto.marca || '-'}</TableCell>
                  <TableCell>{producto.division || '-'}</TableCell>
                  <TableCell>{producto.linea || '-'}</TableCell>
                  <TableCell>{producto.sublinea || '-'}</TableCell>
                  <TableCell>{producto.temperatura || '-'}</TableCell>
                  <TableCell>{producto.unidad || '-'}</TableCell>
                  <TableCell>{producto.lote || '-'}</TableCell>
                  <TableCell>{formatDate(producto.fechaCreacion)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                setSelectedProducto(producto)
                                setIsActualizarOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4 text-naval-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Actualizar producto</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {/* Solo mostrar QR si el producto tiene lote */}
                      {producto.lote && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedProducto(producto)
                                  setIsQROpen(true)
                                }}
                              >
                                <QrCode className="h-4 w-4 text-naval-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Generar QR</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      {/* Solo mostrar detalle si el producto tiene lote */}
                      {producto.lote && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedProducto(producto)
                                  setIsDetalleOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4 text-naval-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Ver detalle</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Diálogos para las acciones */}
      <ProductoDetalleDialog
        isOpen={isDetalleOpen}
        onClose={() => setIsDetalleOpen(false)}
        producto={selectedProducto ? { codigo: selectedProducto.codigo || '', lote: selectedProducto.lote || '' } : null}
      />
      
      <ProductoQRDialog
        isOpen={isQROpen}
        onClose={() => setIsQROpen(false)}
        producto={selectedProducto}
      />
      
      <ProductoActualizarDialog
        isOpen={isActualizarOpen}
        onClose={() => setIsActualizarOpen(false)}
        producto={selectedProducto}
        onSuccess={refreshData}
      />
    </div>
  )
}
