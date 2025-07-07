"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import HistorialSalidas from "@/components/historial/historial-salidas"
import { PackageOpen, Clock, AlertTriangle } from "lucide-react"

export default function HistorialSalidasPage() {
  const [tipoHistorial, setTipoHistorial] = useState<'agotados' | 'expirados'>('agotados')
  const [seleccionado, setSeleccionado] = useState<boolean>(false)

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${tipoHistorial === 'agotados' ? 'border-2 border-naval-600' : 'border'}`}
          onClick={() => {
            setTipoHistorial('agotados')
            setSeleccionado(true)
          }}
        >
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Clock className={`h-12 w-12 mb-4 ${tipoHistorial === 'agotados' ? 'text-naval-600' : 'text-gray-400'}`} />
            <CardTitle className={`text-xl ${tipoHistorial === 'agotados' ? 'text-naval-800' : 'text-gray-500'}`}>Agotados</CardTitle>
            <CardDescription className="text-center mt-2">
              Productos que se han agotado en inventario
            </CardDescription>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-md ${tipoHistorial === 'expirados' ? 'border-2 border-naval-600' : 'border'}`}
          onClick={() => {
            setTipoHistorial('expirados')
            setSeleccionado(true)
          }}
        >
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertTriangle className={`h-12 w-12 mb-4 ${tipoHistorial === 'expirados' ? 'text-naval-600' : 'text-gray-400'}`} />
            <CardTitle className={`text-xl ${tipoHistorial === 'expirados' ? 'text-naval-800' : 'text-gray-500'}`}>Expirados</CardTitle>
            <CardDescription className="text-center mt-2">
              Productos que han alcanzado su fecha de expiración
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {seleccionado && (
        <Card className="naval-card">
          <CardContent>
            <HistorialSalidas tipoHistorialSeleccionado={tipoHistorial} />
          </CardContent>
        </Card>
      )}
      
      {!seleccionado && (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <PackageOpen className="h-16 w-16 text-naval-300" />
          </div>
          <h3 className="text-xl font-medium text-naval-800 mb-2">Seleccione un tipo de historial</h3>
          <p className="text-muted-foreground">
            Elija entre productos agotados o expirados para ver su historial
          </p>
        </div>
      )}
    </div>
  )
}
