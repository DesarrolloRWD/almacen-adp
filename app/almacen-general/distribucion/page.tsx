"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from "lucide-react"

export default function DistribucionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-naval-800 flex items-center">
          <Package className="mr-2 h-6 w-6 text-naval-600" />
          Distribución de Productos
        </h1>
        <p className="text-muted-foreground">Gestione la distribución de productos a diferentes áreas y almacenes.</p>
      </div>

      <Card className="naval-card">
        <CardContent className="pt-6">
          {/* Aquí irá el componente de distribución */}
          <div className="p-8 text-center text-muted-foreground">
            <Package className="mx-auto h-12 w-12 opacity-30 mb-3" />
            <p>El componente de distribución se implementará próximamente.</p>
            <p className="text-sm mt-2">Permitirá asignar productos a diferentes áreas y almacenes.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
