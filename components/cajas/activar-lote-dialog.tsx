"use client"

import { useState } from "react"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

// Esquema de validación para el formulario (simplificado según los requisitos actuales)
const activarLoteSchema = z.object({
  activadoPor: z.string().min(3, { message: "Nombre de quien activa es requerido" }),
  unidadesPorEntregar: z.coerce.number().min(1, { message: "Debe entregar al menos 1 unidad" }),
})

type ActivarLoteFormValues = z.infer<typeof activarLoteSchema>

interface ActivarLoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto: {
    codigo: string
    descripcion?: string
    unidad: string
    pzsPorUnidad?: number
  }
  onActivarLote: () => void
}

export default function ActivarLoteDialog({
  open,
  onOpenChange,
  producto,
  onActivarLote,
}: ActivarLoteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Valores por defecto para el formulario
  const defaultValues: Partial<ActivarLoteFormValues> = {
    activadoPor: "",
    unidadesPorEntregar: 1,
  }

  const form = useForm<ActivarLoteFormValues>({
    resolver: zodResolver(activarLoteSchema),
    defaultValues,
  })

  async function onSubmit(values: ActivarLoteFormValues) {
    try {
      setIsSubmitting(true)
      
      // Preparamos los datos para enviar a la API con el formato simplificado
      const dataToSend = {
        activadoPor: values.activadoPor,
        codigo: producto.codigo,
        // Aseguramos que unidadesPorEntregar sea un número
        unidadesPorEntregar: Number(values.unidadesPorEntregar),
      }
      
      console.log('Activando producto con datos simplificados:', dataToSend)
      
      // Enviamos los datos a la API usando el endpoint correcto
      const response = await fetch(`/api/save/active/producto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      // Procesamos la respuesta
      const data = await response.json()
      
      // Mostramos mensaje de éxito
      toast({
        title: "Lote activado correctamente",
        description: `Se ha activado un nuevo lote de ${producto.descripcion || producto.codigo}.`,
      })
      
      // Cerramos el diálogo y notificamos al componente padre
      onOpenChange(false)
      onActivarLote()
      
    } catch (error) {
      console.error("Error al activar lote:", error)
      toast({
        title: "Error al activar lote",
        description: error instanceof Error ? error.message : "Ha ocurrido un error al activar el lote",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Activar Producto</DialogTitle>
          <DialogDescription>
            Activar una unidad de {producto.descripcion || producto.codigo}
          </DialogDescription>
          <div className="mt-2 text-sm text-muted-foreground">
            <p className="font-medium text-amber-600">
              No se podrá activar otra unidad del mismo producto hasta que se terminen todas las piezas de esta unidad.
            </p>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <p className="text-sm font-medium mb-1">Código</p>
            <p className="text-sm">{producto.codigo}</p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Piezas a Entregar</p>
            <p className="text-sm">{producto.pzsPorUnidad || 'No especificado'} piezas</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="activadoPor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activado Por</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de quien activa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="unidadesPorEntregar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidades Por Entregar</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Activar Producto
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
