"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Esquema de validación
const formSchema = z.object({
  codigo: z.string().min(3, {
    message: "El código debe tener al menos 3 caracteres.",
  }),
  descripcion: z.string().min(5, {
    message: "La descripción debe tener al menos 5 caracteres.",
  }),
  marca: z.string().min(2, {
    message: "La marca debe tener al menos 2 caracteres.",
  }),
  unidadBase: z.string().min(1, {
    message: "La unidad base es requerida.",
  }),
  division: z.string().min(1, {
    message: "La división es requerida.",
  }),
  linea: z.string().min(1, {
    message: "La línea es requerida.",
  }),
  sublinea: z.string().min(1, {
    message: "La sublínea es requerida.",
  }),
  lote: z.string().min(1, {
    message: "El lote es requerido.",
  }),
  fechaExpiracion: z.date({
    required_error: "La fecha de expiración es requerida.",
  }),
  minimos: z.coerce.number().min(0, {
    message: "El valor mínimo debe ser 0 o mayor.",
  }),
  maximos: z.coerce.number().min(0, {
    message: "El valor máximo debe ser 0 o mayor.",
  }),
  creadoPor: z.string().min(1, {
    message: "El creador es requerido.",
  }),
  cantidadNeta: z.coerce.number().min(0, {
    message: "La cantidad neta debe ser 0 o mayor.",
  }),
})

export default function QrGeneratorPage() {
  const [qrData, setQrData] = useState<string>("")
  const [qrUrl, setQrUrl] = useState<string>("")

  // Inicializar formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: "PROD-001",
      descripcion: "Guantes de látex estériles",
      marca: "MediTech",
      unidadBase: "PIEZA",
      division: "Insumos Médicos",
      linea: "Material de Curación",
      sublinea: "Guantes",
      lote: "LOT-2025-001",
      fechaExpiracion: new Date(2026, 11, 31),
      minimos: 10,
      maximos: 100,
      creadoPor: "Usuario",
      cantidadNeta: 50,
    },
  })

  // Manejar envío del formulario
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Formatear los valores del formulario para el QR
      const formattedValues = {
        codigo: values.codigo,
        descripcion: values.descripcion,
        marca: values.marca,
        unidadBase: values.unidadBase,
        division: values.division,
        linea: values.linea,
        sublinea: values.sublinea,
        lote: values.lote,
        fechaExpiracion: `${values.fechaExpiracion.getFullYear()}-${String(values.fechaExpiracion.getMonth() + 1).padStart(2, '0')}-${String(values.fechaExpiracion.getDate()).padStart(2, '0')}T00:00:00.000Z`,
        minimos: Number(values.minimos),
        maximos: Number(values.maximos),
        creadoPor: values.creadoPor,
        cantidadNeta: Number(values.cantidadNeta),
      }
      
      // Convertir a JSON
      const jsonData = JSON.stringify(formattedValues)
      setQrData(jsonData)
      
      // Generar URL para el QR
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(jsonData)}`
      setQrUrl(qrApiUrl)
    } catch (error) {
      console.error("Error al generar QR:", error)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-naval-700">Generador de Códigos QR para Productos</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="bg-naval-50/50 border-naval-100">
                <CardHeader>
                  <CardTitle className="text-naval-700">Información del Producto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="codigo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-naval-700">Código</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej. PROD-001"
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
                              placeholder="Descripción detallada del producto"
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
                      name="unidadBase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-naval-700">Unidad Base</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej. PIEZA"
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
                      name="lote"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-naval-700">Lote</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej. LOT-2025-001"
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
                      name="division"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-naval-700">División</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej. Insumos Médicos"
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
                      name="linea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-naval-700">Línea</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej. Material de Curación"
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
                      name="sublinea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-naval-700">Sublínea</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ej. Guantes"
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
                      name="minimos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-naval-700">Cantidad Mínima</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
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
                      name="maximos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-naval-700">Cantidad Máxima</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
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
                      name="cantidadNeta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-naval-700">Cantidad Neta</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
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
                      name="creadoPor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-naval-700">Creado Por</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nombre del usuario"
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

              <div className="flex justify-end">
                <Button type="submit" className="bg-naval-600 hover:bg-naval-700">
                  Generar Código QR
                </Button>
              </div>
            </form>
          </Form>
        </div>
        
        <div>
          <Card className="bg-naval-50/50 border-naval-100">
            <CardHeader>
              <CardTitle className="text-naval-700">Código QR Generado</CardTitle>
            </CardHeader>
            <CardContent>
              {qrUrl ? (
                <div className="flex flex-col items-center">
                  <div className="border-4 border-white p-2 bg-white rounded-lg shadow-md mb-4">
                    <img src={qrUrl} alt="Código QR del producto" className="w-64 h-64" />
                  </div>
                  <p className="text-sm text-gray-500 mb-4 text-center">
                    Escanea este código con la función de escáner QR en el formulario de registro de productos
                  </p>
                  <div className="w-full">
                    <h3 className="font-medium text-naval-700 mb-2">Datos del QR:</h3>
                    <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-60">
                      {qrData}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <p className="text-gray-500 text-center">
                    Completa el formulario y haz clic en "Generar Código QR" para crear un código QR
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
