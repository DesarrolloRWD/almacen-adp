"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

// Esquema de validación
const formSchema = z.object({
  codigo: z.string().min(3, {
    message: "El código debe tener al menos 3 caracteres.",
  }),
  nombre: z.string().min(5, {
    message: "El nombre debe tener al menos 5 caracteres.",
  }),
  capacidad: z.coerce.number().min(1, {
    message: "La capacidad debe ser al menos 1.",
  }),
  area: z.string().min(1, {
    message: "Debe seleccionar un área.",
  }),
  fechaApertura: z.date({
    required_error: "La fecha de apertura es requerida.",
  }),
  responsable: z.string().min(3, {
    message: "El responsable debe tener al menos 3 caracteres.",
  }),
  producto: z.string().min(1, {
    message: "Debe seleccionar un producto.",
  }),
})

// Interfaz para productos
interface Producto {
  codigo: string
  descripcion: string
  catalogo: string
  unidad: string
  pzsPorUnidad: number
  piezas: number
  marca: string
  fechaExpiracion: string
  tipoMovimiento: string
  movimientoArea: string
}

// Interfaz para productos activos
interface ProductoActivo {
  codigo: string
  unidad: string
  fechaInicio: string
  piezasComienzo: number | null
  piezasEntregadas: number | null
  entregadaPor: string | null
  recibidaPor: string | null
  fechaEntrega: string | null
  piezasRestantes: number | null
}

import ActivarLoteDialog from "./activar-lote-dialog"

export default function NuevaCajaForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])
  const [productosActivos, setProductosActivos] = useState<ProductoActivo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null)
  const [activarDialogOpen, setActivarDialogOpen] = useState(false)

  // Cargar productos y productos activos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Obtener productos
        const productosResponse = await fetch('/api/get/productos', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!productosResponse.ok) {
          throw new Error(`Error al obtener productos: ${productosResponse.status}`)
        }
        
        const productosData = await productosResponse.json()
        setProductos(Array.isArray(productosData) ? productosData : [])
        
        // Obtener productos activos
        const productosActivosResponse = await fetch('/api/get/productos/activos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!productosActivosResponse.ok) {
          throw new Error(`Error al obtener productos activos: ${productosActivosResponse.status}`)
        }
        
        const productosActivosData = await productosActivosResponse.json()
        setProductosActivos(Array.isArray(productosActivosData) ? productosActivosData : [])
        
      } catch (err) {
        console.error('Error al cargar datos:', err)
        setError('No se pudieron cargar los datos. Por favor, intente nuevamente.')
        toast({
          title: 'Error de conexión',
          description: 'No se pudieron cargar los datos necesarios.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  // Verificar si un producto ya está activo
  const isProductoActivo = (codigo: string) => {
    return productosActivos.some(p => p.codigo === codigo)
  }

  // Inicializar formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: "",
      nombre: "",
      capacidad: 100,
      area: "",
      fechaApertura: new Date(),
      responsable: "",
      producto: "",
    },
  })

  // Manejar envío del formulario
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // Buscar el producto seleccionado
      const producto = productos.find(p => p.codigo === values.producto)
      
      if (!producto) {
        throw new Error("Producto no encontrado")
      }
      
      // Verificar si el producto ya está activo
      if (isProductoActivo(producto.codigo)) {
        toast({
          title: "Producto ya activo",
          description: `El producto ${producto.codigo} ya tiene un lote activo. No se puede activar otro hasta que se termine el actual.`,
          variant: "destructive",
        })
        return
      }
      
      // Guardar el producto seleccionado para el diálogo de activación
      setSelectedProducto(producto)
      
      // Abrir el diálogo de activación
      setActivarDialogOpen(true)
      
    } catch (error) {
      console.error("Error al procesar el formulario:", error)
      toast({
        title: "Error al procesar el formulario",
        description: error instanceof Error ? error.message : "Ocurrió un error al procesar el formulario. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Función para refrescar la lista de productos activos
  const refreshProductosActivos = async () => {
    try {
      const response = await fetch('/api/get/productos/activos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Error al obtener productos activos: ${response.status}`)
      }
      
      const data = await response.json()
      setProductosActivos(Array.isArray(data) ? data : [])
      
      // Resetear formulario
      form.reset()
      
    } catch (err) {
      console.error('Error al refrescar productos activos:', err)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="codigo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. A-123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Caja Filtros Aire" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="capacidad"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Capacidad</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormDescription>Número máximo de productos que puede contener la caja</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar área" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Almacén Principal">Flebotomia</SelectItem>
                    <SelectItem value="Almacén Secundario">Coagulacion</SelectItem>
                    <SelectItem value="Producción">Inmunohematologia</SelectItem>
                    <SelectItem value="Mantenimiento">Serologia</SelectItem>
                    <SelectItem value="Calidad">Fraccionammiento</SelectItem>
                    <SelectItem value="Logística">NAT</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fechaApertura"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fecha de Apertura</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="responsable"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Responsable</FormLabel>
                <FormControl>
                  <Input placeholder="Nombre del responsable" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="producto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Producto</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                  {loading ? (
                    <div className="flex items-center justify-center p-4">
                      <CalendarIcon className="mr-2 h-4 w-4 animate-spin" />
                      <span>Cargando productos...</span>
                    </div>
                  ) : error ? (
                    <div className="p-4 text-center text-red-500">{error}</div>
                  ) : productos.length === 0 ? (
                    <div className="p-4 text-center">No hay productos disponibles</div>
                  ) : (
                    productos.map((producto) => {
                      const activo = isProductoActivo(producto.codigo);
                      return (
                        <SelectItem 
                          key={producto.codigo} 
                          value={producto.codigo}
                          disabled={activo}
                          className={activo ? "opacity-50" : ""}
                        >
                          {producto.descripcion} {activo && "(Activo)"}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
                </Select>
                <FormDescription>Producto que contendrá esta caja</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Registrar Caja"}
          </Button>
        </div>
      </form>
      
      {/* Diálogo para activar lote */}
      {selectedProducto && (
        <ActivarLoteDialog
          open={activarDialogOpen}
          onOpenChange={setActivarDialogOpen}
          producto={{
            codigo: selectedProducto.codigo,
            descripcion: selectedProducto.descripcion,
            unidad: selectedProducto.unidad,
            pzsPorUnidad: selectedProducto.pzsPorUnidad
          }}
          onActivarLote={refreshProductosActivos}
        />
      )}
    </Form>
  )
}
