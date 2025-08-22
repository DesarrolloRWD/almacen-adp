"use client"

import { useState } from "react"
import { VerificarRemisionSearch } from "@/components/remision/verificar-remision-search"
import { VerificarRemisionList } from "@/components/remision/verificar-remision-list"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ClipboardCheck } from "lucide-react"

export default function VerificarRemisionesPage() {
  const [productos, setProductos] = useState<any[]>([])
  const [ordenRemision, setOrdenRemision] = useState<string>("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)

  const handleSearchStart = () => {
    setIsSearching(true)
    setSearchPerformed(false)
    setProductos([])
  }

  const handleSearchResult = (data: any) => {
    if (data && Array.isArray(data)) {
      setProductos(data)
      // Extraer el número de remisión de la búsqueda
      const input = document.getElementById("ordenRemision") as HTMLInputElement
      if (input) {
        setOrdenRemision(input.value)
      }
    } else {
      setProductos([])
    }
    setIsSearching(false)
    setSearchPerformed(true)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Verificar Remisiones</h1>
        <p className="text-muted-foreground">
          Verifique los productos recibidos en una remisión
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-6">
          <VerificarRemisionSearch 
            onSearchStart={handleSearchStart} 
            onSearchResult={handleSearchResult} 
          />

          {isSearching && (
            <div className="flex items-center justify-center p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {searchPerformed && productos.length === 0 && !isSearching && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No encontrado</AlertTitle>
              <AlertDescription>
                No se encontró ninguna remisión con el número especificado o no contiene productos.
              </AlertDescription>
            </Alert>
          )}

          {!searchPerformed && !isSearching && (
            <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed text-muted-foreground">
              <ClipboardCheck className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-center">
                Ingresa un número de remisión para verificar los productos recibidos
              </p>
            </div>
          )}

          {productos.length > 0 && (
            <VerificarRemisionList 
              productos={productos} 
              ordenRemision={ordenRemision}
            />
          )}
        </div>
      </div>
    </div>
  )
}
