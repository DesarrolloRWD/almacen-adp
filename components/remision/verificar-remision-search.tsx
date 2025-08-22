"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface VerificarRemisionSearchProps {
  onSearchResult: (data: any) => void
  onSearchStart: () => void
}

export function VerificarRemisionSearch({ onSearchResult, onSearchStart }: VerificarRemisionSearchProps) {
  const [ordenRemision, setOrdenRemision] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { token, issValue } = useAuth()

  const handleSearch = async () => {
    if (!ordenRemision.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingrese un número de remisión",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      onSearchStart()

      const response = await fetch("/verificar/remision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          ordenRemision
          // No enviamos el tenant, lo establecerá el backend
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      onSearchResult(data)
    } catch (error) {
      console.error("Error al buscar remisión:", error)
      toast({
        title: "Error",
        description: "No se pudo encontrar la remisión. Por favor intente nuevamente.",
        variant: "destructive",
      })
      onSearchResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ordenRemision">Número de Remisión</Label>
        <div className="flex space-x-2">
          <Input
            id="ordenRemision"
            placeholder="Ingrese el número de remisión a verificar"
            value={ordenRemision}
            onChange={(e) => setOrdenRemision(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch()
              }
            }}
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? "Buscando..." : "Buscar"}
          </Button>
        </div>
      </div>
    </div>
  )
}
