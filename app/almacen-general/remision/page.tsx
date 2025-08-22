"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { getTenantFromToken } from "@/lib/jwt-utils"
import { ProductoSelector, ProductoRemision } from "../../../components/remision/producto-selector"
import { RemisionForm } from "../../../components/remision/remision-form"

export default function GenerarRemisionPage() {
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoRemision[]>([])
  
  // Verificar el tenant al cargar la página
  useEffect(() => {
    const issValue = getTenantFromToken()
    // Verificación silenciosa del tenant
  }, [])
  
  const handleAgregarProducto = (producto: ProductoRemision) => {
    setProductosSeleccionados(prev => [...prev, producto])
  }
  
  const handleRemoverProducto = (index: number) => {
    setProductosSeleccionados(prev => prev.filter((_, i) => i !== index))
  }
  
  const handleActualizarCantidad = (index: number, cantidad: string) => {
    setProductosSeleccionados(prev => 
      prev.map((producto, i) => 
        i === index ? { ...producto, cantidad } : producto
      )
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Generar Remisión</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="naval-card">
          <CardHeader>
            <CardTitle>Información de Remisión</CardTitle>
          </CardHeader>
          <CardContent>
            <RemisionForm 
              productosSeleccionados={productosSeleccionados}
              onRemoverProducto={handleRemoverProducto}
              onActualizarCantidad={handleActualizarCantidad}
            />
          </CardContent>
        </Card>
        
        <Card className="naval-card">
          <CardHeader>
            <CardTitle>Seleccionar Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductoSelector onAgregarProducto={handleAgregarProducto} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
