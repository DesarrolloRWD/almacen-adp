"use client"

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
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface RemisionDetailsProps {
  remision: any | null
}

export function RemisionDetails({ remision }: RemisionDetailsProps) {
  if (!remision) {
    return null
  }

  const { informacion, detalleRemision } = remision
  
  // Determinar si todos los productos están verificados
  const todosVerificados = detalleRemision?.every((item: any) => item.confirmacionRecibido === true) || false
  const algunoVerificado = detalleRemision?.some((item: any) => item.confirmacionRecibido === true) || false
  const estadoRemision = todosVerificados ? "completa" : algunoVerificado ? "pendiente" : "sin verificar"

  // Formatear fecha si existe
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "N/A"
      const date = new Date(dateString)
      return format(date, "dd/MM/yyyy HH:mm", { locale: es })
    } catch (error) {
      return dateString || "N/A"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Información General de Remisión</CardTitle>
          <CardDescription>
            Remisión #{informacion?.ordenRemision || "N/A"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <span className="font-medium">Número de Remisión:</span>{" "}
                {informacion?.ordenRemision || "N/A"}
              </div>
              <div>
                <span className="font-medium">Fecha de Salida:</span>{" "}
                {formatDate(informacion?.fechaSalida)}
              </div>
              <div>
                <span className="font-medium">Hospital:</span>{" "}
                {informacion?.hospital || "N/A"}
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="font-medium">Tipo de Salida:</span>{" "}
                <Badge variant="outline">{informacion?.tipoSalida || "N/A"}</Badge>
              </div>
              <div>
                <span className="font-medium">Almacén Proveniente:</span>{" "}
                {informacion?.almacenProveniente || "N/A"}
              </div>
              <div>
                <span className="font-medium">Estado:</span>{" "}
                <Badge variant={estadoRemision === "completa" ? "default" : "secondary"}
                  className={estadoRemision === "completa" ? "bg-green-100 text-green-800 hover:bg-green-200" : 
                           estadoRemision === "pendiente" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" : 
                           "bg-gray-100 text-gray-800 hover:bg-gray-200"}
                >
                  {estadoRemision === "completa" ? "Completa" : 
                   estadoRemision === "pendiente" ? "Pendiente" : "Sin verificar"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detalle de Productos</CardTitle>
          <CardDescription>
            Listado de productos incluidos en la remisión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Estado</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Observaciones</TableHead>
                <TableHead>Verificado por</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detalleRemision && detalleRemision.length > 0 ? (
                detalleRemision.map((item: any, index: number) => (
                  <TableRow key={index} className={item.confirmacionRecibido ? "bg-green-50" : ""}>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {item.confirmacionRecibido ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-gray-300" />
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.confirmacionRecibido ? "Verificado" : "No verificado"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="font-medium">{item.codigo || "N/A"}</TableCell>
                    <TableCell>{item.descripcion || "N/A"}</TableCell>
                    <TableCell>{item.cantidad || 0}</TableCell>
                    <TableCell>{item.unidad || "N/A"}</TableCell>
                    <TableCell>
                      {item.observaciones || 
                        (item.confirmacionRecibido ? "Sin observaciones" : "")}
                    </TableCell>
                    <TableCell>
                      {item.confirmadoPor || (item.confirmacionRecibido ? "Sistema" : "")}
                    </TableCell>
                    <TableCell>
                      {item.fechaConfirmacion ? formatDate(item.fechaConfirmacion) : ""}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    No hay productos en esta remisión
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
