"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Warehouse } from "lucide-react"
import { getTenantFromToken } from "@/lib/jwt-utils"
import ProductosZoquesTable from "@/components/zoques/productos-zoques-table"

export default function AlmacenGeneralPage() {
  // Verificar el tenant al cargar la página
  useEffect(() => {
    const issValue = getTenantFromToken()
    // Verificación silenciosa del tenant
  }, [])
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Warehouse className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Almacén General</h2>
      </div>

      <Card className="naval-card">
        <CardContent className="p-6">
          <ProductosZoquesTable />
        </CardContent>
      </Card>
    </div>
  )
}
