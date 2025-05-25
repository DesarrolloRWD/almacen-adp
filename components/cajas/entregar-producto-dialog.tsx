"use client"

import { useState, useEffect } from "react"
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
import { Loader2, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Esquema de validación para el formulario de entrega de productos
const entregarProductoSchema = z.object({
  entregadoPor: z.string().min(3, { message: "Nombre de quien entrega es requerido" }),
  recibidoPor: z.string().min(3, { message: "Nombre de quien recibe es requerido" }),
  unidadesPorEntregar: z.coerce.number().min(1, { message: "Debe entregar al menos 1 unidad" }),
})

type EntregarProductoFormValues = z.infer<typeof entregarProductoSchema>

interface EntregarProductoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto: {
    codigo: string
    descripcion?: string
    unidad: string
    piezasRestantes?: number
  }
  onEntregarProducto: () => void
}

export default function EntregarProductoDialog({
  open,
  onOpenChange,
  producto,
  onEntregarProducto,
}: EntregarProductoDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productoInfo, setProductoInfo] = useState<any>(null)
  const [loadingInfo, setLoadingInfo] = useState(false)
  const [errorInfo, setErrorInfo] = useState<string | null>(null)

  // Valores por defecto para el formulario
  const defaultValues: Partial<EntregarProductoFormValues> = {
    entregadoPor: "",
    recibidoPor: "",
    unidadesPorEntregar: 1,
  }
  
  // Obtener información detallada del producto cuando el diálogo se abre
  useEffect(() => {
    if (open && producto.codigo) {
      fetchProductoInfo(producto.codigo)
    }
  }, [open, producto.codigo])
  
  // Función para obtener información detallada del producto
  const fetchProductoInfo = async (codigo: string) => {
    try {
      setLoadingInfo(true)
      setErrorInfo(null)
      
      // Usar el endpoint relativo para obtener información del producto
      const response = await fetch('/api/get/productos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Buscar el producto específico por código
      const productoEncontrado = Array.isArray(data) 
        ? data.find((p: any) => p.codigo === codigo)
        : null
      
      if (productoEncontrado) {
        // console.log('Información del producto encontrada:', productoEncontrado)
        setProductoInfo(productoEncontrado)
      } else {
        // console.log('Producto no encontrado en la respuesta')
        setErrorInfo('No se encontró información detallada del producto')
      }
    } catch (error) {
      console.error('Error al obtener información del producto:', error)
      setErrorInfo('Error al cargar la información del producto')
    } finally {
      setLoadingInfo(false)
    }
  }

  const form = useForm<EntregarProductoFormValues>({
    resolver: zodResolver(entregarProductoSchema),
    defaultValues,
  })

  async function onSubmit(values: EntregarProductoFormValues) {
    try {
      setIsSubmitting(true)
      
      // Preparamos los datos para enviar a la API con el formato requerido
      const dataToSend = {
        entregadoPor: values.entregadoPor,
        recibidoPor: values.recibidoPor,
        codigo: producto.codigo,
        // Aseguramos que unidadesPorEntregar sea un número
        unidadesPorEntregar: Number(values.unidadesPorEntregar),
      }
      
      // console.log('Entregando producto con datos:', dataToSend)
      
      // Enviamos los datos a la API usando el endpoint relativo y el método POST
      const response = await fetch(`/api/save/active/entrega/producto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entregadoPor: dataToSend.entregadoPor,
          recibidoPor: dataToSend.recibidoPor,
          codigo: dataToSend.codigo,
          unidadesPorEntregar: dataToSend.unidadesPorEntregar
        })
      })
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      
      // Procesamos la respuesta
      const data = await response.json()
      
      // Calculamos el total de piezas entregadas si tenemos la información
      const piezasPorUnidad = productoInfo?.pzsPorUnidad || 1
      const totalPiezas = Number(values.unidadesPorEntregar) * piezasPorUnidad
      
      // Mostramos mensaje de éxito con información detallada
      toast({
        title: "Producto entregado correctamente",
        description: productoInfo?.pzsPorUnidad 
          ? `Se ha registrado la entrega de ${values.unidadesPorEntregar} caja(s) (${totalPiezas} piezas) de ${producto.descripcion || producto.codigo}.`
          : `Se ha registrado la entrega de ${values.unidadesPorEntregar} unidad(es) de ${producto.descripcion || producto.codigo}.`,
      })
      
      // Cerramos el diálogo y notificamos al componente padre
      onOpenChange(false)
      onEntregarProducto()
      
    } catch (error) {
      console.error("Error al entregar producto:", error)
      toast({
        title: "Error al entregar producto",
        description: error instanceof Error ? error.message : "Ha ocurrido un error al entregar el producto",
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
          <DialogTitle>Entregar Producto</DialogTitle>
          <DialogDescription>
            Registrar entrega de {producto.descripcion || producto.codigo}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div>
            <p className="text-sm font-medium mb-1">Código</p>
            <p className="text-sm">{producto.codigo}</p>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Piezas Disponibles</p>
            {loadingInfo ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-naval-600" />
                <p className="text-sm">Cargando...</p>
              </div>
            ) : errorInfo ? (
              <p className="text-sm text-red-500">{producto.piezasRestantes || 'No especificado'} piezas</p>
            ) : productoInfo ? (
              <div className="flex items-center">
                <p className="text-sm font-medium text-naval-700">{productoInfo.piezas || 0} piezas</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 ml-1 text-naval-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Unidad: {productoInfo.unidad || producto.unidad}</p>
                      <p className="text-xs">Piezas por unidad: {productoInfo.pzsPorUnidad || 'No especificado'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              <p className="text-sm">{producto.piezasRestantes || 'No especificado'} piezas</p>
            )}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="entregadoPor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entregado Por</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de quien entrega" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="recibidoPor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recibido Por</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre de quien recibe" {...field} />
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
                  <div className="flex items-center justify-between">
                    <FormLabel>Cajas a Entregar</FormLabel>
                    {productoInfo && productoInfo.pzsPorUnidad && (
                      <span className="text-xs text-naval-600">
                        Cada caja contiene {productoInfo.pzsPorUnidad} piezas
                      </span>
                    )}
                  </div>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      {...field} 
                    />
                  </FormControl>
                  {productoInfo && productoInfo.pzsPorUnidad && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Total: {Number(field.value) * productoInfo.pzsPorUnidad} piezas
                    </p>
                  )}
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
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  'Entregar Producto'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
