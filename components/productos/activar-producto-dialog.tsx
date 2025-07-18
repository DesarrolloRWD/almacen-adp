"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ActivarProductoForm } from "./activar-producto-form"

// Definimos la interfaz para los productos según el formato de la API
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

interface ActivarProductoDialogProps {
  producto: Producto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ActivarProductoDialog({
  producto,
  open,
  onOpenChange,
  onSuccess,
}: ActivarProductoDialogProps) {
  if (!producto) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Activar Producto</DialogTitle>
          <DialogDescription>
            Activar una unidad de {producto.descripcion} ({producto.unidadBase}) para entrega de piezas.
          </DialogDescription>
          <div className="mt-2 text-sm text-muted-foreground">
            <p>Al activar este producto, se abrirá una unidad ({producto.unidadBase}) que contiene {producto.maximos} piezas.</p>
            <p className="mt-1 font-medium text-amber-600">No se podrá activar otra unidad del mismo producto hasta que se terminen todas las piezas de esta unidad.</p>
          </div>
        </DialogHeader>
        <ActivarProductoForm 
          producto={producto} 
          onSuccess={() => {
            onSuccess()
            onOpenChange(false)
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
