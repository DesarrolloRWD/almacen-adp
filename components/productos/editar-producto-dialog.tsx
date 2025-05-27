"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EditarProductoForm } from "./editar-producto-form"

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

interface EditarProductoDialogProps {
  producto: Producto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditarProductoDialog({
  producto,
  open,
  onOpenChange,
  onSuccess,
}: EditarProductoDialogProps) {
  if (!producto) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Insumo</DialogTitle>
          <DialogDescription>
            Actualiza la información del insumo {producto.codigo} - {producto.descripcion}
          </DialogDescription>
        </DialogHeader>
        <EditarProductoForm 
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
