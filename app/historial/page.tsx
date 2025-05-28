import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import HistorialMovimientos from "@/components/historial/historial-movimientos"
import { PackageCheck } from "lucide-react"

export default function HistorialPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-naval-800 flex items-center">
          <PackageCheck className="mr-2 h-6 w-6 text-naval-600" />
          Entregas
        </h1>
        <p className="text-muted-foreground">
          Gestione las entregas de insumos médicos y medicamentos.
        </p>
      </div>

      <Card className="naval-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-naval-800">Registro de Entregas</CardTitle>
          <CardDescription>Seleccione productos por lote y catálogo para registrar entregas</CardDescription>
        </CardHeader>
        <CardContent>
          <HistorialMovimientos />
        </CardContent>
      </Card>
    </div>
  )
}
