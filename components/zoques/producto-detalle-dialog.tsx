"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DetalleProductoRequest, getProductoDetalle } from "@/lib/api"
import { Loader2 } from "lucide-react"

interface ProductoDetalleDialogProps {
  isOpen: boolean
  onClose: () => void
  producto: DetalleProductoRequest | null
}

export default function ProductoDetalleDialog({
  isOpen,
  onClose,
  producto
}: ProductoDetalleDialogProps) {
  const [detalleProducto, setDetalleProducto] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDetalleProducto = async () => {
      if (!producto || !isOpen) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const detalle = await getProductoDetalle(producto)
        setDetalleProducto(detalle)
      } catch (err) {
        console.error("Error al obtener detalle del producto:", err)
        setError("No se pudo obtener la información detallada del producto")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDetalleProducto()
  }, [producto, isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Detalle del Producto</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-naval-600" />
            <span className="ml-2">Cargando información...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 py-4">{error}</div>
        ) : detalleProducto ? (
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-naval-700">Código:</p>
              <p>{detalleProducto.codigo || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-naval-700">Lote:</p>
              <p>{detalleProducto.lote || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-naval-700">Descripción:</p>
              <p>{detalleProducto.descripcion || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-naval-700">Descripción Corta:</p>
              <p>{detalleProducto.descripcionCorta || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-naval-700">Marca:</p>
              <p>{detalleProducto.marca || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-naval-700">División:</p>
              <p>{detalleProducto.division || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-naval-700">Línea:</p>
              <p>{detalleProducto.linea || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-naval-700">Sublínea:</p>
              <p>{detalleProducto.sublinea || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-naval-700">Temperatura:</p>
              <p>{detalleProducto.temperatura || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-naval-700">Unidad:</p>
              <p>{detalleProducto.unidad || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-naval-700">Fecha Creación:</p>
              <p>{detalleProducto.fechaCreacion || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-naval-700">Fecha Expiración:</p>
              <p>{detalleProducto.fechaExpiracion || '-'}</p>
            </div>
            {/* Mostrar campos adicionales si existen */}
            {Object.entries(detalleProducto)
              .filter(([key]) => !['codigo', 'lote', 'descripcion', 'descripcionCorta', 'marca', 'division', 
                               'linea', 'sublinea', 'temperatura', 'unidad', 'fechaCreacion', 'fechaExpiracion'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm font-medium text-naval-700">{key.charAt(0).toUpperCase() + key.slice(1)}:</p>
                  <p>{String(value) || '-'}</p>
                </div>
              ))
            }
          </div>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            No hay información disponible
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
