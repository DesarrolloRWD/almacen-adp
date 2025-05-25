"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

// Definimos el esquema de validación simplificado con solo los campos necesarios
const formSchema = z.object({
  codigo: z.string().min(1, {
    message: "El código es requerido.",
  }),
  activadoPor: z.string().min(1, {
    message: "El campo 'Activado por' es requerido.",
  }),
  unidadesPorEntregar: z.coerce.number().min(1, {
    message: "Debe ser al menos 1.",
  }),
})

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

interface ActivarProductoFormProps {
  producto: Producto
  onSuccess: () => void
  onCancel: () => void
}

export function ActivarProductoForm({ producto, onSuccess, onCancel }: ActivarProductoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Inicializar el formulario con los valores del producto (simplificado)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: producto.codigo || "",
      activadoPor: "",
      unidadesPorEntregar: 1,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      // Usar el proxy local para evitar problemas de CORS
      const response = await fetch(`/api/save/active/producto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || `Error: ${response.status}`)
      }

      toast({
        title: "Producto activado",
        description: `El producto ${values.codigo} ha sido activado correctamente.`,
      })

      // Actualizar la UI y redirigir
      router.refresh()
      onSuccess()
    } catch (error) {
      console.error("Error al activar el producto:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al activar el producto.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="codigo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. INS-001" {...field} disabled />
                </FormControl>
                <FormDescription>
                  {producto.descripcion} - {producto.marca}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unidadesPorEntregar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Piezas a Entregar</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max={producto.pzsPorUnidad} {...field} />
                </FormControl>
                <FormDescription>
                  Cada {producto.unidad} contiene {producto.pzsPorUnidad} piezas
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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

          {/* Los campos entregadoPor y recibidoPor se han eliminado ya que no son necesarios para la activación */}
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Activar Producto
          </Button>
        </div>
      </form>
    </Form>
  )
}
