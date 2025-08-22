"use client"

import { useState } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle2, AlertCircle, Check, MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/useAuth"

interface ProductoRemision {
  id: string
  codigo: string
  cantidad: string
  unidad: string
  descripcion: string
  verificado?: boolean
  observaciones?: string
}

interface VerificarRemisionListProps {
  productos: ProductoRemision[] | null
  ordenRemision: string
}

export function VerificarRemisionList({ productos, ordenRemision }: VerificarRemisionListProps) {
  const [productosVerificados, setProductosVerificados] = useState<ProductoRemision[]>(
    productos ? productos.map(p => ({ ...p, verificado: false, observaciones: "" })) : []
  )
  const [guardando, setGuardando] = useState(false)
  const [verificacionCompletada, setVerificacionCompletada] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Actualizar productos cuando cambia la prop
  useState(() => {
    if (productos) {
      setProductosVerificados(productos.map(p => ({ ...p, verificado: false, observaciones: "" })))
      setVerificacionCompletada(false)
    }
  })

  const handleVerificarProducto = (id: string) => {
    setProductosVerificados(prev => 
      prev.map(producto => 
        producto.id === id 
          ? { ...producto, verificado: true } 
          : producto
      )
    )
  }
  
  const handleUpdateObservaciones = (id: string, observaciones: string) => {
    setProductosVerificados(prev => 
      prev.map(producto => 
        producto.id === id 
          ? { ...producto, observaciones } 
          : producto
      )
    )
  }

  const handleVerificarTodos = () => {
    setProductosVerificados(prev => 
      prev.map(producto => ({ ...producto, verificado: true }))
    )
  }

  const handleLimpiarVerificacion = () => {
    setProductosVerificados(prev => 
      prev.map(producto => ({ ...producto, verificado: false }))
    )
  }

  const handleGuardarVerificacion = async () => {
    try {
      setGuardando(true)
      
      // Obtener los productos verificados
      const productosConfirmados = productosVerificados.filter(p => p.verificado)
      
      if (productosConfirmados.length === 0) {
        toast({
          title: "Error",
          description: "No hay productos verificados para guardar",
          variant: "destructive",
        })
        setGuardando(false)
        return
      }
      
      // Contador de éxitos y errores
      let exitosos = 0;
      let fallidos = 0;
      let mensajesError = [];
      
      // Obtener el nombre del usuario logueado o usar un valor por defecto
      const nombreUsuario = user?.nombre || "Usuario del sistema";
      
      // Enviar cada producto verificado al endpoint de confirmación
      for (const producto of productosConfirmados) {
        try {
          const confirmacionData = {
            id: producto.id,
            confirmacionRecibido: true,
            confirmadoPor: nombreUsuario,
            observaciones: producto.observaciones && producto.observaciones.trim() !== "" 
              ? producto.observaciones 
              : "Correcto"
          }
          
          // console.log(`Enviando confirmación para producto ${producto.codigo}:`, confirmacionData);
          
          const response = await fetch("/confirmar/remision", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(confirmacionData)
          })
          
          const responseData = await response.json();
          
          if (responseData.success === false) {
            console.error(`Error al confirmar producto ${producto.codigo}:`, responseData);
            fallidos++;
            mensajesError.push(`${producto.codigo}: ${responseData.error || 'Error desconocido'}`);
          } else {
            // console.log(`Producto ${producto.codigo} confirmado con éxito:`, responseData);
            exitosos++;
          }
        } catch (error) {
          console.error(`Error al procesar producto ${producto.codigo}:`, error);
          fallidos++;
          mensajesError.push(`${producto.codigo}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }
      
      // Mostrar mensaje según los resultados
      if (exitosos > 0 && fallidos === 0) {
        toast({
          title: "Verificación guardada",
          description: `Se ha guardado la verificación de ${exitosos} productos de la remisión #${ordenRemision}`,
        })
        // Marcar la verificación como completada para mostrar mensaje de éxito
        setVerificacionCompletada(true)
        // Limpiar los productos verificados para permitir buscar una nueva remisión
        setProductosVerificados([])
      } else if (exitosos > 0 && fallidos > 0) {
        toast({
          title: "Verificación parcial",
          description: `Se guardaron ${exitosos} productos, pero ${fallidos} fallaron. Revise la consola para más detalles.`,
          variant: "destructive",
        })
        console.error("Errores en productos:", mensajesError);
      } else {
        toast({
          title: "Error",
          description: `No se pudo guardar ninguna verificación. ${mensajesError.length > 0 ? mensajesError[0] : ''}`,
          variant: "destructive",
        })
      }
      
      setGuardando(false)
    } catch (error) {
      console.error("Error general al guardar verificación:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la verificación. Por favor intente nuevamente.",
        variant: "destructive",
      })
      setGuardando(false)
    }
  }

  // Mostrar mensaje de verificación completada
  if (verificacionCompletada) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verificación Completada</CardTitle>
          <CardDescription>
            La verificación de la remisión #{ordenRemision} ha sido guardada correctamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-center text-lg font-medium mb-2">
              ¡Verificación guardada con éxito!
            </p>
            <p className="text-center text-muted-foreground mb-6">
              Todos los productos seleccionados han sido verificados correctamente.
            </p>
            <Button 
              onClick={() => {
                // Limpiar el campo de búsqueda
                const input = document.getElementById("ordenRemision") as HTMLInputElement
                if (input) input.value = ""
                // Resetear el estado
                setVerificacionCompletada(false)
              }}
            >
              Buscar nueva remisión
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (!productos || productos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verificación de Remisión</CardTitle>
          <CardDescription>
            No se encontraron productos para esta remisión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6 text-muted-foreground">
            <AlertCircle className="mr-2 h-5 w-5" />
            <span>No hay productos para verificar</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const todosVerificados = productosVerificados.every(p => p.verificado)
  const algunoVerificado = productosVerificados.some(p => p.verificado)

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Verificación de Remisión #{ordenRemision}</CardTitle>
            <CardDescription>
              Marque los productos que han sido verificados
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleVerificarTodos}
              disabled={todosVerificados}
            >
              Verificar todos
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLimpiarVerificacion}
              disabled={!algunoVerificado}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Verificado</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead className="w-24">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productosVerificados.map((producto) => (
              <TableRow key={producto.id} className={producto.verificado ? "bg-green-50" : ""}>
                <TableCell>
                  {producto.verificado ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-gray-300" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{producto.codigo}</TableCell>
                <TableCell>{producto.descripcion}</TableCell>
                <TableCell>{producto.cantidad}</TableCell>
                <TableCell>{producto.unidad}</TableCell>
                <TableCell>
                  <Input
                    placeholder="Observaciones"
                    value={producto.observaciones || ""}
                    onChange={(e) => handleUpdateObservaciones(producto.id, e.target.value)}
                    disabled={producto.verificado}
                    className="w-full"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant={producto.verificado ? "outline" : "default"}
                    onClick={() => handleVerificarProducto(producto.id)}
                    disabled={producto.verificado}
                    className="w-full"
                  >
                    {producto.verificado ? "Verificado" : "Verificar"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {todosVerificados ? (
              <span className="flex items-center text-green-600">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Todos los productos han sido verificados
              </span>
            ) : (
              <span>
                Verificados: {productosVerificados.filter(p => p.verificado).length} de {productosVerificados.length}
              </span>
            )}
          </div>
          <Button 
            onClick={handleGuardarVerificacion} 
            disabled={!algunoVerificado || guardando}
          >
            {guardando ? "Guardando..." : "Guardar verificación"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
