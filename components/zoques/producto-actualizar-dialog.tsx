"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ActualizarProductoZoques, ProductoZoques, updateProductoZoques } from "@/lib/api"

interface ProductoActualizarDialogProps {
  isOpen: boolean
  onClose: () => void
  producto: ProductoZoques | null
  onSuccess?: () => void
}

export default function ProductoActualizarDialog({
  isOpen,
  onClose,
  producto,
  onSuccess
}: ProductoActualizarDialogProps) {
  const [lote, setLote] = useState<string>("")
  const [descripcionCorta, setDescripcionCorta] = useState<string>("")
  const [fechaExpiracion, setFechaExpiracion] = useState<Date | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)

  // Resetear los campos cuando se abre el diálogo con un nuevo producto
  useState(() => {
    if (isOpen && producto) {
      setLote(producto.lote || "")
      setDescripcionCorta("")
      setFechaExpiracion(undefined)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!producto || !producto.codigo) {
      toast.error("No se puede actualizar el producto sin código")
      return
    }
    
    // Verificar que al menos un campo tenga valor
    if (!lote && !descripcionCorta && !fechaExpiracion) {
      toast.error("Debe completar al menos un campo para actualizar")
      return
    }
    
    setIsLoading(true)
    
    try {
      // Preparar los datos para la actualización
      const datosActualizacion: ActualizarProductoZoques = {
        codigoRequest: {
          codigo: producto.codigo
        }
      }
      
      // Agregar solo los campos que tienen valor
      if (lote) datosActualizacion.lote = lote
      if (descripcionCorta) datosActualizacion.descripcionCorta = descripcionCorta
      if (fechaExpiracion) datosActualizacion.fechaExpiracion = fechaExpiracion.toISOString()
      
      // Enviar la solicitud de actualización
      await updateProductoZoques(datosActualizacion)
      toast.success("Producto actualizado correctamente")
      
      // Llamar al callback de éxito si existe
      if (onSuccess) onSuccess()
      
      // Cerrar el diálogo
      onClose()
    } catch (error) {
      toast.error(`Error al actualizar el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Actualizar Producto</DialogTitle>
        </DialogHeader>
        
        {producto ? (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-naval-700">Código:</Label>
                <p className="text-sm">{producto.codigo || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-naval-700">Descripción:</Label>
                <p className="text-sm">{producto.descripcion || '-'}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lote">Lote</Label>
              <Input 
                id="lote" 
                value={lote} 
                onChange={(e) => setLote(e.target.value)}
                placeholder="Nuevo lote"
              />
              <p className="text-xs text-muted-foreground">Actual: {producto.lote || 'No especificado'}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descripcionCorta">Descripción Corta</Label>
              <Input 
                id="descripcionCorta" 
                value={descripcionCorta} 
                onChange={(e) => setDescripcionCorta(e.target.value)}
                placeholder="Nueva descripción corta"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Fecha de Expiración</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fechaExpiracion && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaExpiracion ? format(fechaExpiracion, "PPP") : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaExpiracion}
                    onSelect={setFechaExpiracion}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar
              </Button>
            </div>
          </form>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            No hay información disponible para actualizar
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
