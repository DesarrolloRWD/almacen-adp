"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Send, Loader2, FileText } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getTenantFromToken } from "@/lib/jwt-utils"
import { ProductoRemision } from "./producto-selector"
import { generateRemisionPDF } from "@/lib/pdf-utils"

interface RemisionFormProps {
  productosSeleccionados: ProductoRemision[]
  onRemoverProducto: (index: number) => void
  onActualizarCantidad: (index: number, cantidad: string) => void
}

export function RemisionForm({ 
  productosSeleccionados, 
  onRemoverProducto, 
  onActualizarCantidad 
}: RemisionFormProps) {
  const { toast } = useToast()
  const [ordenRemision, setOrdenRemision] = useState("")
  const [fechaSalida, setFechaSalida] = useState("")
  const [hospital, setHospital] = useState("")
  const [tipoSalida, setTipoSalida] = useState("")
  const [almacenProveniente, setAlmacenProveniente] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ordenRemision || !fechaSalida || !hospital || !tipoSalida || !almacenProveniente) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      })
      return
    }
    
    if (productosSeleccionados.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos un producto",
        variant: "destructive",
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const token = localStorage.getItem("token") || ""
      const issValue = getTenantFromToken()
      
      const remisionData = {
        informacion: {
          ordenRemision,
          fechaSalida: new Date(fechaSalida).toISOString(),
          hospital,
          tipoSalida,
          almacenProveniente,
        },
        detalleRemision: productosSeleccionados,
      }
      
      const apiUrl = "/create/remision"
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...remisionData, tenant: issValue }),
      })
      
      if (!response.ok) {
        throw new Error(`Error al crear remisión: ${response.status}`)
      }
      
      const data = await response.json()
      
      toast({
        title: "Éxito",
        description: "Remisión creada correctamente",
      })
      
      // Generar PDF de la remisión
      try {
        generateRemisionPDF({
          informacion: {
            ordenRemision,
            fechaSalida: new Date(fechaSalida).toISOString(),
            hospital,
            tipoSalida,
            almacenProveniente,
          },
          detalleRemision: productosSeleccionados,
        });
        
        toast({
          title: "PDF Generado",
          description: "Se ha generado el PDF de la remisión",
        });
      } catch (pdfError) {
        console.error("Error al generar PDF:", pdfError);
        toast({
          title: "Advertencia",
          description: "La remisión se creó correctamente, pero hubo un problema al generar el PDF",
          variant: "destructive",
        });
      }
      
      // Limpiar formulario
      setOrdenRemision("")
      setFechaSalida("")
      setHospital("")
      setTipoSalida("")
      setAlmacenProveniente("")
      
      // Limpiar productos seleccionados
      productosSeleccionados.forEach((_, index) => {
        onRemoverProducto(0) // Siempre remover el primero hasta que no quede ninguno
      })
      
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
      console.error("Error al crear remisión:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ordenRemision">Orden de Remisión</Label>
          <Input
            id="ordenRemision"
            value={ordenRemision}
            onChange={(e) => setOrdenRemision(e.target.value)}
            placeholder="Número de orden"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="fechaSalida">Fecha de Salida</Label>
          <Input
            id="fechaSalida"
            type="date"
            value={fechaSalida}
            onChange={(e) => setFechaSalida(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="hospital">Hospital</Label>
          <Input
            id="hospital"
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            placeholder="Hospital destino"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="tipoSalida">Tipo de Salida</Label>
          <Select value={tipoSalida} onValueChange={setTipoSalida}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
              <SelectItem value="traslado">Traslado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="almacenProveniente">Almacén Proveniente</Label>
          <Input
            id="almacenProveniente"
            value={almacenProveniente}
            onChange={(e) => setAlmacenProveniente(e.target.value)}
            placeholder="Almacén de origen"
          />
        </div>
      </div>
      
      <div className="mt-4">
        <h3 className="text-lg font-medium mb-2">Productos Seleccionados</h3>
        {productosSeleccionados.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead className="w-[80px]">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productosSeleccionados.map((producto, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{producto.codigo}</TableCell>
                    <TableCell>{producto.descripcion}</TableCell>
                    <TableCell>{producto.unidad}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={producto.cantidad}
                        onChange={(e) => onActualizarCantidad(index, e.target.value)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => onRemoverProducto(index)}
                        title="Eliminar producto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-4 border rounded-md">
            No hay productos seleccionados
          </div>
        )}
      </div>
      
      <div className="flex gap-2 mt-4">
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Crear Remisión
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
