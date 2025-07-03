"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

// Definimos las divisiones con sus colores correspondientes
const divisiones = [
  { value: "COAGULACIÓN", label: "COAGULACIÓN", color: "#40E0D0" },
  { value: "FRACCIONAMIENTO", label: "FRACCIONAMIENTO", color: "#87CEEB" },
  { value: "TOMA DE MUESTRA/SANGRADO", label: "TOMA DE MUESTRA/SANGRADO", color: "#FFD700" },
  { value: "INMUNOHEMATOLOGIA", label: "INMUNOHEMATOLOGIA", color: "#D3D3D3" },
  { value: "CONFIRMATORIAS", label: "CONFIRMATORIAS", color: "#FF9999" },
  { value: "NAT", label: "NAT", color: "#FFA07A" },
  { value: "NAT PANTHER", label: "NAT PANTHER", color: "#A0522D" },
  { value: "HEMATOLOGÍA", label: "HEMATOLOGÍA", color: "#90EE90" },
  { value: "SEROLOGÍA", label: "SEROLOGÍA", color: "#6495ED" },
  { value: "BIOLOGIA MOLECULAR", label: "BIOLOGIA MOLECULAR", color: "#708090" },
  { value: "CITOMETRÍA", label: "CITOMETRÍA", color: "#DDA0DD" },
]

// Definimos el esquema de validación completo con todos los campos necesarios para la API
const formSchema = z.object({
  codigo: z.string().min(1, {
    message: "El código es requerido.",
  }),
  descripcion: z.string().min(1, {
    message: "La descripción es requerida.",
  }),
  marca: z.string().min(1, {
    message: "La marca es requerida.",
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
  sublinea: z.string().optional(),
  lote: z.string().optional(),
  fechaExpiracion: z.date({
    required_error: "La fecha de expiración es requerida.",
  }),
  minimos: z.coerce.number().min(0, {
    message: "No puede ser negativo.",
  }),
  maximos: z.coerce.number().min(0, {
    message: "No puede ser negativo.",
  }),
  cantidadNeta: z.coerce.number().min(0, {
    message: "No puede ser negativo.",
  }),
  creadoPor: z.string().optional(),
})

// Definimos la interfaz para los productos según el formato de la API
interface Producto {
  codigo: string
  descripcion: string
  marca: string
  unidadBase: string
  division: string
  linea: string
  sublinea?: string
  lote?: string
  fechaExpiracion: string
  minimos: number
  maximos: number
  cantidadNeta: number
  creadoPor?: string
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
      marca: producto.marca || "",
      unidadBase: producto.unidadBase || "",
      division: producto.division || "",
      linea: producto.linea || "",
      sublinea: producto.sublinea || "",
      lote: producto.lote || "",
      fechaExpiracion: fechaExpiracion,
      minimos: producto.minimos || 0,
      maximos: producto.maximos || 0,
      cantidadNeta: producto.cantidadNeta || 0,
      creadoPor: producto.creadoPor || "sistema",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      // Identificar solo los campos que han cambiado
      const changedFields: Record<string, any> = {}
      
      // Comparar con los valores originales del producto
      if (values.descripcion !== producto.descripcion) changedFields.descripcion = values.descripcion
      if (values.marca !== producto.marca) changedFields.marca = values.marca
      if (values.unidadBase !== producto.unidadBase) changedFields.unidadBase = values.unidadBase
      if (values.division !== producto.division) changedFields.division = values.division
      if (values.linea !== producto.linea) changedFields.linea = values.linea
      if (values.sublinea !== producto.sublinea) changedFields.sublinea = values.sublinea
      
      // Para la fecha, comparar los valores en formato ISO
      const originalDate = producto.fechaExpiracion ? new Date(producto.fechaExpiracion).toISOString() : ""
      const newDate = values.fechaExpiracion.toISOString()
      if (newDate !== originalDate) changedFields.fechaExpiracion = newDate
      
      // Para los campos numéricos, convertir a número para comparar
      if (Number(values.minimos) !== producto.minimos) changedFields.minimos = Number(values.minimos)
      if (Number(values.maximos) !== producto.maximos) changedFields.maximos = Number(values.maximos)
      if (Number(values.cantidadNeta) !== producto.cantidadNeta) changedFields.cantidadNeta = Number(values.cantidadNeta)
      if (values.creadoPor !== producto.creadoPor) changedFields.creadoPor = values.creadoPor || "sistema"
      
      // Formatear los datos exactamente en el formato requerido por la API
      const formattedValues = {
        "codigo": values.codigo,
        "lote": values.lote || "1",
        "itemInformation": {
          // No incluir código ni lote dentro de itemInformation
          ...changedFields  // Solo incluir los campos que han cambiado
        }
      }

      // //////console.log('Actualizando insumo con datos:', formattedValues)

      //////console.log('Enviando datos:', JSON.stringify(formattedValues, null, 2))
      
      // Usar el proxy local para evitar problemas de CORS
      const response = await fetch(`/api/update/producto`, {
        method: 'POST',  // El proxy local usa POST, pero internamente hace un PUT a la API
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
            name="division"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>División</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground",
                          field.value && (() => {
                            const selectedDivision = divisiones.find(d => d.value === field.value);
                            return selectedDivision ? `bg-[${selectedDivision.color}] bg-opacity-20` : "";
                          })()
                        )}
                      >
                        {field.value ? (
                          <>
                            <div 
                              className="w-4 h-4 rounded-full mr-2" 
                              style={{ 
                                backgroundColor: divisiones.find(d => d.value === field.value)?.color || "transparent" 
                              }}
                            />
                            {field.value}
                          </>
                        ) : (
                          "Seleccione una división"
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Buscar división..." />
                      <CommandEmpty>No se encontraron divisiones.</CommandEmpty>
                      <CommandGroup>
                        {divisiones.map((division) => (
                          <CommandItem
                            key={division.value}
                            value={division.value}
                            onSelect={() => {
                              form.setValue("division", division.value);
                            }}
                            className="flex items-center"
                          >
                            <div 
                              className="w-4 h-4 rounded-full mr-2" 
                              style={{ backgroundColor: division.color }}
                            />
                            <span>{division.label}</span>
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                field.value === division.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
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
            name="unidadBase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad Base</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. CAJA" {...field} disabled />
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
                <FormLabel>Máximos</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    value={field.value} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled
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
                <FormLabel>Cantidad Neta</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    value={field.value} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled
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
                        disabled
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
                      disabled={true}
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
            name="linea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Línea</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. Medicamentos" {...field} />
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
                  <Input placeholder="Ej. Analgésicos" {...field} />
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
                  <Input placeholder="Ej. LOT123456" {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minimos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mínimos</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    value={field.value} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    disabled
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
                <FormLabel>Creado Por</FormLabel>
                <FormControl>
                  <Input placeholder="Ej. sistema" {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* No se requiere sección de información adicional para esta versión */}

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
