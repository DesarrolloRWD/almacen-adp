"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getTenantFromToken } from "@/lib/jwt-utils"

// Definición local de la interfaz ProductoRemision
export interface ProductoRemision {
  codigo: string;
  cantidad: string;
  unidad: string;
  descripcion: string;
}

interface ProductoSelectorProps {
  onAgregarProducto: (producto: ProductoRemision) => void
}

export function ProductoSelector({ onAgregarProducto }: ProductoSelectorProps) {
  const [productos, setProductos] = useState<any[]>([])
  const [filteredProductos, setFilteredProductos] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProductos = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const token = localStorage.getItem("token") || ""
        const issValue = getTenantFromToken()
        
        const response = await fetch("/api/zoques/list/all", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          }
        })
        
        if (!response.ok) {
          throw new Error(`Error al cargar productos: ${response.status}`)
        }
        
        const data = await response.json()
        // console.log('Respuesta de la API:', data)
        // La API puede devolver los datos directamente o dentro de una propiedad 'data'
        const productosData = data.data || data || []
        setProductos(productosData)
        setFilteredProductos(productosData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
        console.error("Error al cargar productos:", err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProductos()
  }, [])
  
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProductos(productos)
    } else {
      const filtered = productos.filter(
        (producto) =>
          producto.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producto.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProductos(filtered)
    }
  }, [searchTerm, productos])
  
  const handleAgregarProducto = (producto: any) => {
    const productoRemision: ProductoRemision = {
      codigo: producto.codigo || "",
      descripcion: producto.descripcion || "",
      cantidad: "1", // Cantidad por defecto
      unidad: producto.unidad || "",
    }
    
    onAgregarProducto(productoRemision)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o descripción..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-4">Cargando productos...</div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">{error}</div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="w-[80px]">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProductos.length > 0 ? (
                filteredProductos.slice(0, 10).map((producto) => (
                  <TableRow key={producto.codigo}>
                    <TableCell className="font-medium">{producto.codigo}</TableCell>
                    <TableCell>{producto.descripcion}</TableCell>
                    <TableCell>{producto.unidad}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAgregarProducto(producto)}
                        title="Agregar a remisión"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
