"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Stethoscope, PackageOpen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"

// Esquema de validación
const formSchema = z.object({
  codigo: z.string().min(3, {
    message: "El código debe tener al menos 3 caracteres.",
  }),
  descripcion: z.string().min(5, {
    message: "La descripción debe tener al menos 5 caracteres.",
  }),
  catalogo: z.string().min(1, {
    message: "Debe seleccionar un catálogo.",
  }),
  unidad: z.string().min(1, {
    message: "Debe seleccionar una unidad.",
  }),
  pzsPorUnidad: z.coerce.number().min(1, {
    message: "Debe ser al menos 1.",
  }),
  piezas: z.coerce.number().min(1, {
    message: "Debe ser al menos 1.",
  }),
  marca: z.string().min(2, {
    message: "La marca debe tener al menos 2 caracteres.",
  }),
  fechaExpiracion: z.date({
    required_error: "La fecha de expiración es requerida.",
  }),
  tipoMovimiento: z.string().min(1, {
    message: "Debe seleccionar un tipo de movimiento.",
  }),
  movimientoArea: z.string().min(1, {
    message: "Debe seleccionar un área de movimiento.",
  }),
})

export default function RegistrarProductoForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inicializar formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: "",
      descripcion: "",
      catalogo: "",
      unidad: "",
      pzsPorUnidad: 1,
      piezas: 1,
      marca: "",
      fechaExpiracion: new Date(),
      tipoMovimiento: "Entrada",
      movimientoArea: "Almacén Principal",
    },
  })

  // Manejar envío del formulario
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // Preparar los datos para enviar a la API
      console.log("Enviando datos originales:", values)
      
      // Asegurarnos de que los campos numéricos se envíen como números y no como cadenas
      const formattedValues = {
        ...values,
        // Convertir explícitamente a números para asegurar que se envíen correctamente
        pzsPorUnidad: Number(values.pzsPorUnidad),
        piezas: Number(values.piezas),
        // Formatear la fecha para que coincida con el formato esperado por la API
        fechaExpiracion: values.fechaExpiracion.toISOString()
      }
      
      console.log('Intentando conectar a través del proxy local')
      console.log('Datos formateados para envío:', formattedValues)
      
      // Usar el proxy local para evitar problemas de CORS
      const response = await fetch(`/api/save/information`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedValues),
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Error ${response.status}: ${errorData}`)
      }
      
      const responseData = await response.json()
      console.log('Respuesta de la API:', responseData)

      // Mostrar mensaje de éxito
      toast({
        title: "Insumo registrado",
        description: `El insumo ${values.codigo} ha sido registrado exitosamente.`,
      })

      // Resetear formulario
      form.reset()
    } catch (error) {
      console.error("Error al registrar insumo:", error)
      toast({
        title: "Error al registrar insumo",
        description: `Ocurrió un error al intentar registrar el insumo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="bg-naval-50/50 border-naval-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4 text-naval-700">
              <Stethoscope className="h-5 w-5" />
              <h3 className="font-medium">Información del Insumo Médico</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-naval-700">Código</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. INS-001"
                        {...field}
                        className="border-naval-200 focus-visible:ring-naval-500"
                      />
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
                    <FormLabel className="text-naval-700">Marca</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. MediTech"
                        {...field}
                        className="border-naval-200 focus-visible:ring-naval-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-naval-700">Descripción</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descripción detallada del insumo médico"
                        {...field}
                        className="border-naval-200 focus-visible:ring-naval-500"
                      />
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
                    <FormLabel className="text-naval-700">Catálogo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. 6679684190"
                        {...field}
                        className="border-naval-200 focus-visible:ring-naval-500"
                      />
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
                    <FormLabel className="text-naval-700">Unidad</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. CAJA2X 6PBAS"
                        {...field}
                        className="border-naval-200 focus-visible:ring-naval-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-naval-50/50 border-naval-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4 text-naval-700">
              <PackageOpen className="h-5 w-5" />
              <h3 className="font-medium">Información de Inventario</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="pzsPorUnidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-naval-700">Piezas por Unidad</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        className="border-naval-200 focus-visible:ring-naval-500"
                      />
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
                    <FormLabel className="text-naval-700">Cantidad Total (Piezas)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        className="border-naval-200 focus-visible:ring-naval-500"
                      />
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
                    <FormLabel className="text-naval-700">Fecha de Expiración</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal border-naval-200",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
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
                          className="border-naval-200"
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
                    <FormLabel className="text-naval-700">Tipo de Movimiento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-naval-200 focus-visible:ring-naval-500">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Entrada">Entrada</SelectItem>
                        <SelectItem value="Salida">Salida</SelectItem>
                        <SelectItem value="Traslado">Traslado</SelectItem>
                        <SelectItem value="Ajuste">Ajuste</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="movimientoArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-naval-700">Área de Movimiento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-naval-200 focus-visible:ring-naval-500">
                          <SelectValue placeholder="Seleccionar área" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Almacén Principal">Flebotomia</SelectItem>
                        <SelectItem value="Farmacia">Coagulacion</SelectItem>
                        <SelectItem value="Quirófano">Inmunohematologia</SelectItem>
                        <SelectItem value="Emergencias">Serologia</SelectItem>
                        <SelectItem value="Hospitalización">Fraccionammiento</SelectItem>
                        <SelectItem value="Consulta Externa">Fraccionammiento</SelectItem>
                        <SelectItem value="Laboratorio">NAT</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="bg-naval-600 hover:bg-naval-700">
            {isSubmitting ? "Registrando..." : "Registrar Insumo Médico"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
