"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { ActualizarProductoZoques, updateProductoZoques } from "@/lib/api"

// Esquema de validación para el formulario de búsqueda
const busquedaSchema = z.object({
  codigo: z.string().min(1, "El código es obligatorio"),
})

// Esquema de validación para el formulario de actualización
const actualizacionSchema = z.object({
  lote: z.string().optional(),
  fechaExpiracion: z.date().optional(),
  descripcionCorta: z.string().optional(),
})

export default function ActualizarProductoForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [codigoProducto, setCodigoProducto] = useState("")
  const [mostrarFormularioActualizacion, setMostrarFormularioActualizacion] = useState(false)

  // Formulario de búsqueda
  const busquedaForm = useForm<z.infer<typeof busquedaSchema>>({
    resolver: zodResolver(busquedaSchema),
    defaultValues: {
      codigo: "",
    },
  })

  // Formulario de actualización
  const actualizacionForm = useForm<z.infer<typeof actualizacionSchema>>({
    resolver: zodResolver(actualizacionSchema),
    defaultValues: {
      lote: "",
      descripcionCorta: "",
    },
  })

  // Función para buscar el producto por código
  const onBuscar = async (values: z.infer<typeof busquedaSchema>) => {
    setIsLoading(true)
    try {
      // Aquí solo validamos que el código exista
      // En una implementación más completa, podríamos verificar si el producto existe
      setCodigoProducto(values.codigo)
      setMostrarFormularioActualizacion(true)
      toast.success("Producto encontrado. Puede actualizar los campos.")
    } catch (error) {
      toast.error("Error al buscar el producto")
    } finally {
      setIsLoading(false)
    }
  }

  // Función para actualizar el producto
  const onActualizar = async (values: z.infer<typeof actualizacionSchema>) => {
    if (!codigoProducto) {
      toast.error("Primero debe buscar un producto por código")
      return
    }

    setIsLoading(true)
    try {
      // Preparar los datos para la actualización
      const datosActualizacion: ActualizarProductoZoques = {
        codigoRequest: {
          codigo: codigoProducto,
        },
      }

      // Agregar solo los campos que tienen valor
      if (values.lote) datosActualizacion.lote = values.lote
      if (values.descripcionCorta) datosActualizacion.descripcionCorta = values.descripcionCorta
      if (values.fechaExpiracion) {
        datosActualizacion.fechaExpiracion = values.fechaExpiracion.toISOString()
      }

      // Verificar que al menos un campo tenga valor
      if (!values.lote && !values.descripcionCorta && !values.fechaExpiracion) {
        toast.error("Debe completar al menos un campo para actualizar")
        setIsLoading(false)
        return
      }

      // Enviar la solicitud de actualización
      await updateProductoZoques(datosActualizacion)
      toast.success("Producto actualizado correctamente")
      
      // Reiniciar el formulario de actualización
      actualizacionForm.reset()
    } catch (error) {
      toast.error(`Error al actualizar el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Buscar Producto</CardTitle>
          <CardDescription>Ingrese el código del producto que desea actualizar</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...busquedaForm}>
            <form onSubmit={busquedaForm.handleSubmit(onBuscar)} className="space-y-4">
              <FormField
                control={busquedaForm.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código del Producto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el código" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Buscando..." : "Buscar Producto"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {mostrarFormularioActualizacion && (
        <Card>
          <CardHeader>
            <CardTitle>Actualizar Producto</CardTitle>
            <CardDescription>Actualice los campos del producto con código: {codigoProducto}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...actualizacionForm}>
              <form onSubmit={actualizacionForm.handleSubmit(onActualizar)} className="space-y-4">
                <FormField
                  control={actualizacionForm.control}
                  name="lote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lote</FormLabel>
                      <FormControl>
                        <Input placeholder="Nuevo lote" {...field} />
                      </FormControl>
                      <FormDescription>Opcional: Deje en blanco para mantener el valor actual</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={actualizacionForm.control}
                  name="descripcionCorta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción Corta</FormLabel>
                      <FormControl>
                        <Input placeholder="Nueva descripción corta" {...field} />
                      </FormControl>
                      <FormDescription>Opcional: Deje en blanco para mantener el valor actual</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={actualizacionForm.control}
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
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Seleccione una fecha</span>
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
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>Opcional: Deje en blanco para mantener el valor actual</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Actualizando..." : "Actualizar Producto"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
