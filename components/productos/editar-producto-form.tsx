"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Loader2 } from "lucide-react"
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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// Definimos el esquema de validación simplificado con solo los campos necesarios
const formSchema = z.object({
  codigo: z.string().min(1, {
    message: "El código es requerido.",
  }),
  descripcion: z.string().min(1, {
    message: "La descripción es requerida.",
  }),
  catalogo: z.string().min(1, {
    message: "El catálogo es requerido.",
  }),
  unidad: z.string().min(1, {
    message: "La unidad es requerida.",
  }),
  pzsPorUnidad: z.coerce.number().min(1, {
    message: "Debe ser al menos 1.",
  }),
  piezas: z.coerce.number().min(0, {
    message: "No puede ser negativo.",
  }),
  marca: z.string().min(1, {
    message: "La marca es requerida.",
  }),
  fechaExpiracion: z.date({
    required_error: "La fecha de expiración es requerida.",
  }),
  tipoMovimiento: z.string().min(1, {
    message: "El tipo de movimiento es requerido.",
  }),
  movimientoArea: z.string().min(1, {
    message: "El área de movimiento es requerida.",
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

interface EditarProductoFormProps {
  producto: Producto
  onSuccess: () => void
  onCancel: () => void
}

export function EditarProductoForm({ producto, onSuccess, onCancel }: EditarProductoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Convertir la fecha de string a Date
  const fechaExpiracion = producto.fechaExpiracion ? new Date(producto.fechaExpiracion) : new Date()

  // Inicializar el formulario con los valores del producto
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: producto.codigo || "",
      descripcion: producto.descripcion || "",
      catalogo: producto.catalogo || "",
      unidad: producto.unidad || "",
      pzsPorUnidad: producto.pzsPorUnidad || 0,
      piezas: producto.piezas || 0,
      marca: producto.marca || "",
      fechaExpiracion: fechaExpiracion,
      tipoMovimiento: producto.tipoMovimiento || "Actualización",
      movimientoArea: producto.movimientoArea || "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      // Formatear los datos exactamente en el formato requerido por la API
      const formattedValues = {
        codigo: values.codigo,
        object: {
          codigo: values.codigo,
          descripcion: values.descripcion,
          catalogo: values.catalogo,
          unidad: values.unidad,
          // Aseguramos que los campos numéricos se envíen como números
          pzsPorUnidad: Number(values.pzsPorUnidad),
          piezas: Number(values.piezas),
          marca: values.marca,
          fechaExpiracion: values.fechaExpiracion.toISOString(),
          tipoMovimiento: values.tipoMovimiento,
          movimientoArea: values.movimientoArea
        }
      }

      console.log('Actualizando insumo con datos:', formattedValues)

      // Usar el proxy local para evitar problemas de CORS
      const response = await fetch(`/api/update/producto`, {
        method: 'PUT',  // Usamos PUT para actualizar recursos
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || `Error: ${response.status}`)
      }

      toast({
        title: "Insumo actualizado",
        description: `El insumo ${values.codigo} ha sido actualizado correctamente.`,
      })

      // Actualizar la UI y redirigir
      router.refresh()
      onSuccess()
    } catch (error) {
      console.error("Error al actualizar el insumo:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al actualizar el insumo.",
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
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Guantes de Nitrilo Talla M" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="catalogo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catálogo</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. 6679684190" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="marca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. MedGuard" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="unidad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. CAJA2X 6PBAS" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pzsPorUnidad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Piezas por Unidad</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="piezas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Piezas Disponibles</FormLabel>
                <FormControl>
                  <Input type="number" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fechaExpiracion"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Expiración</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipoMovimiento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Movimiento</FormLabel>
                <FormControl>
                  <Input {...field} readOnly />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="movimientoArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área de Movimiento</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Almacén Principal" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Información Adicional</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Los campos de activación se han eliminado ya que no son necesarios para la actualización */}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Form>
  )
}
