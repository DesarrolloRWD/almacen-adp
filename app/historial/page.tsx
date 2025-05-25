import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import HistorialMovimientos from "@/components/historial/historial-movimientos"
import { History } from "lucide-react"

export default function HistorialPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-naval-800 flex items-center">
          <History className="mr-2 h-6 w-6 text-naval-600" />
          Historial de Movimientos
        </h1>
        <p className="text-muted-foreground">
          Consulte el registro completo de movimientos de insumos médicos y medicamentos.
        </p>
      </div>

      <Card className="naval-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-naval-800">Registro de Movimientos</CardTitle>
          <CardDescription>Historial completo de entradas y salidas de insumos médicos</CardDescription>
        </CardHeader>
        <CardContent>
          <HistorialMovimientos />
        </CardContent>
      </Card>
    </div>
  )
}
