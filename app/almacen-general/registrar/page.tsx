"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"
import RegistrarProductoZoquesForm from "@/components/zoques/registrar-producto-zoques-form"

export default function RegistrarProductoPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-naval-800 flex items-center">
          <PlusCircle className="mr-2 h-6 w-6 text-naval-600" />
          Registro de Productos
        </h1>
        <p className="text-muted-foreground">Agregue nuevos productos al inventario del almacén general.</p>
      </div>

      <Card className="naval-card">
        <CardContent className="pt-6">
          <RegistrarProductoZoquesForm />
        </CardContent>
      </Card>
    </div>
  )
}
