"use client"

import { useState } from "react"
import { RemisionSearch } from "@/components/remision/remision-search"
import { RemisionDetails } from "@/components/remision/remision-details"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Search } from "lucide-react"

export default function RemisionesHistorialPage() {
  const [remision, setRemision] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)

  const handleSearchStart = () => {
    setIsSearching(true)
    setSearchPerformed(false)
  }

  const handleSearchResult = (data: any) => {
    setRemision(data)
    setIsSearching(false)
    setSearchPerformed(true)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Historial de Remisiones</h1>
        <p className="text-muted-foreground">
          Consulta el historial de remisiones por número de remisión
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          <RemisionSearch 
            onSearchStart={handleSearchStart} 
            onSearchResult={handleSearchResult} 
          />

          {isSearching && (
            <div className="flex items-center justify-center p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {searchPerformed && !remision && !isSearching && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No encontrado</AlertTitle>
              <AlertDescription>
                No se encontró ninguna remisión con el número especificado.
              </AlertDescription>
            </Alert>
          )}

          {!searchPerformed && !isSearching && (
            <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed text-muted-foreground">
              <Search className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-center">
                Ingresa un número de remisión para ver su historial
              </p>
            </div>
          )}

          {remision && <RemisionDetails remision={remision} />}
        </div>
      </div>
    </div>
  )
}
