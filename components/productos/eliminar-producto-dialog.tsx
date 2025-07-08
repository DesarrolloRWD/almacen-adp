"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { AlertCircle } from "lucide-react"

// Interfaz para los datos del producto
interface Producto {
  id?: string
  codigo: string
  descripcion: string
  marca: string
  lote?: string
  fechaExpiracion: string
  cantidadNeta: number
}

// Interfaz para las props del componente
interface EliminarProductoDialogProps {
  producto: Producto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EliminarProductoDialog({
  producto,
  open,
  onOpenChange,
  onSuccess
}: EliminarProductoDialogProps) {
  const [motivo, setMotivo] = useState("")
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Función para formatear la fecha
  const formatearFecha = (fechaStr: string) => {
    try {
      // Extraer solo la fecha sin la hora para evitar problemas de zona horaria
      const fechaSinHora = fechaStr.split('T')[0];
      // Crear la fecha usando año, mes y día explícitamente
      const [año, mes, día] = fechaSinHora.split('-');
      // Crear una fecha local con esos componentes (mes-1 porque en JS los meses van de 0-11)
      const fecha = new Date(parseInt(año), parseInt(mes)-1, parseInt(día));
      return fecha.toLocaleDateString();
    } catch (e) {
      return fechaStr;
    }
  }

  // Función para manejar la eliminación del producto
  const handleEliminarProducto = async () => {
    if (!producto || !producto.id) {
      setError("No se puede eliminar el producto: información incompleta")
      return
    }

    if (!motivo.trim()) {
      setError("Por favor, ingresa el motivo de eliminación")
      return
    }

    try {
      setEliminando(true)
      setError(null)
      
      // Formato de fecha actual en ISO
      const fechaActual = new Date().toISOString()
      
      // Obtener el token de autenticación de las cookies del navegador
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      // Extraer el nombre de usuario del token JWT
      let nombreUsuario = "";
      if (token) {
        try {
          // Decodificar el token JWT (sin verificar la firma)
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const payload = JSON.parse(jsonPayload);
          nombreUsuario = payload.sub || payload.usuario || "";
        } catch (error) {
          console.error("Error al decodificar el token:", error);
        }
      }
      
      // Crear el objeto con el formato exacto que espera la API
      const datosEliminacion = {
        id: producto.id,
        lote: producto.lote || "",
        codigo: producto.codigo,
        motivo: motivo.trim(),
        fechaExpiracion: producto.fechaExpiracion,
        fechaEliminacion: fechaActual,
        eliminadoPor: nombreUsuario
      }
      
      //console.log('Datos de eliminación enviados:', datosEliminacion)
      
      const response = await fetch('/api/delete/product', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(datosEliminacion)
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Error al eliminar el producto'
        
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorData.message || errorMessage
          console.error('Respuesta de error detallada:', errorData)
        } catch (e) {
          console.error('Error al parsear respuesta:', errorText)
        }
        
        throw new Error(errorMessage)
      }
      
      toast.success(`Producto ${producto.codigo} eliminado correctamente`)
      onOpenChange(false)
      setMotivo("")
      onSuccess()
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      setError(`Error al eliminar el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    } finally {
      setEliminando(false)
    }
  }

  // Resetear el estado cuando se cierra el diálogo
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setMotivo("")
      setError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-red-600">Eliminar Producto</DialogTitle>
          <DialogDescription>
            ¿Estás seguro que deseas eliminar este producto? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 p-3 rounded-md flex items-start gap-2 text-red-800 text-sm mb-4">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="codigo" className="text-right font-medium">
                Código
              </Label>
              <div className="mt-1 font-semibold">{producto?.codigo || ""}</div>
            </div>
            <div>
              <Label htmlFor="lote" className="text-right font-medium">
                Lote
              </Label>
              <div className="mt-1">{producto?.lote || "-"}</div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="descripcion" className="text-right font-medium">
              Descripción
            </Label>
            <div className="mt-1 font-semibold">{producto?.descripcion || ""}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marca" className="text-right font-medium">
                Marca
              </Label>
              <div className="mt-1">{producto?.marca || ""}</div>
            </div>
            <div>
              <Label htmlFor="fechaExpiracion" className="text-right font-medium">
                Fecha de Expiración
              </Label>
              <div className="mt-1">{producto?.fechaExpiracion ? formatearFecha(producto.fechaExpiracion) : "-"}</div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="motivo" className="text-right font-medium">
              Motivo de Eliminación <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ingresa el motivo por el cual se eliminará este producto"
              className="mt-1"
              required
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={eliminando}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleEliminarProducto}
            disabled={eliminando}
          >
            {eliminando ? "Eliminando..." : "Eliminar Producto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
