import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import HistorialSalidas from "@/components/historial/historial-salidas"
import { PackageOpen } from "lucide-react"

export default function HistorialSalidasPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-naval-800 flex items-center">
          <PackageOpen className="mr-2 h-6 w-6 text-naval-600" />
          Historial de Salidas
        </h1>
        <p className="text-muted-foreground">
          Consulte el historial de salidas de insumos médicos y medicamentos.
        </p>
      </div>

      <Card className="naval-card">
        <CardContent>
          <HistorialSalidas />
        </CardContent>
      </Card>
    </div>
  )
}
