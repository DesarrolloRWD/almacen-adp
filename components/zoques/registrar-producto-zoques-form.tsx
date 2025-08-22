"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { NuevoProductoZoques, saveProductoZoques } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Loader2 } from "lucide-react"

// Esquema de validación para el formulario
const formSchema = z.object({
  codigo: z.string().min(1, "El código es obligatorio"),
  marca: z.string().min(1, "La marca es obligatoria"),
  descripcion: z.string().min(1, "La descripción es obligatoria"),
  division: z.string().min(1, "La división es obligatoria"),
  unidad: z.string().min(1, "La unidad es obligatoria"),
  lote: z.string().min(1, "El lote es obligatorio"),
  linea: z.string().min(1, "La línea es obligatoria"),
  sublinea: z.string().min(1, "La sublínea es obligatoria"),
  temperatura: z.string().min(1, "La temperatura es obligatoria"),
})

export default function RegistrarProductoZoquesForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Inicializar el formulario con React Hook Form y Zod
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: "",
      marca: "",
      descripcion: "",
      division: "",
      unidad: "",
      lote: "",
      linea: "",
      sublinea: "",
      temperatura: "",
    },
  })

  // Función para manejar el envío del formulario
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true)
      
      // Crear el objeto de producto con los valores del formulario
      const nuevoProducto: NuevoProductoZoques = {
        codigo: values.codigo,
        marca: values.marca,
        descripcion: values.descripcion,
        division: values.division,
        unidad: values.unidad,
        lote: values.lote,
        linea: values.linea,
        sublinea: values.sublinea,
        temperatura: values.temperatura,
      }
      
      // Enviar el producto al API
      await saveProductoZoques(nuevoProducto)
      
      // Mostrar mensaje de éxito detallado
      toast.success("Producto registrado correctamente", {
        description: `El producto ${values.codigo} ha sido registrado exitosamente.`,
        duration: 3000
      })
      
      // Resetear el formulario
      form.reset()
    } catch (error) {
      // Mejorar el log de error con más información
      console.error("[Zoques][Form] Error al registrar producto:", 
        error instanceof Error ? error.message : String(error))
      // Mostrar mensaje de error más detallado
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error("Error al registrar el producto", {
        description: `${errorMessage}. Por favor, intente de nuevo.`,
        duration: 5000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el código del producto" {...field} />
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
                      <Input placeholder="Ingrese la marca" {...field} />
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
                      <Input placeholder="Ingrese la descripción" {...field} />
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
                    <FormLabel>División</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese la división" {...field} />
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
                      <Input placeholder="Ingrese la unidad" {...field} />
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
                    <FormLabel>Lote</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el lote" {...field} />
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
                    <FormLabel>Línea</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese la línea" {...field} />
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
                    <FormLabel>Sublínea</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese la sublínea" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="temperatura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperatura</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese la temperatura" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrar Producto"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
