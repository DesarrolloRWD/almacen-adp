import PresentacionesTable from "@/components/productos/presentaciones-table"
import { Layers } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CajasPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-naval-800 flex items-center">
          <Layers className="mr-2 h-6 w-6 text-naval-600" />
          Presentaciones
        </h1>
        <p className="text-muted-foreground">
          Visualice todas las presentaciones disponibles en el sistema.
        </p>
      </div>

      <Card className="naval-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-naval-800">Registro de Presentaciones</CardTitle>
          <CardDescription>Historial completo de presentaciones de insumos médicos</CardDescription>
        </CardHeader>
        <CardContent>
          <PresentacionesTable />
        </CardContent>
      </Card>
    </div>
  )
}
