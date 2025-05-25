import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import CajasActivas from "@/components/cajas/cajas-activas"
import NuevaCajaForm from "@/components/cajas/nueva-caja-form"
import { PackageOpen, PlusCircle } from "lucide-react"

export default function CajasPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-naval-800 flex items-center">
          <PackageOpen className="mr-2 h-6 w-6 text-naval-600" />
          Gestión de Lotes
        </h1>
        <p className="text-muted-foreground">
          Administre los lotes de insumos médicos y medicamentos del Hospital Naval.
        </p>
      </div>

      <div className="flex justify-end">
        <Button className="bg-naval-600 hover:bg-naval-700">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Lote
        </Button>
      </div>

      <Tabs defaultValue="activas" className="w-full">
        <TabsList className="bg-naval-50 text-naval-700 w-full md:w-[400px]">
          <TabsTrigger
            value="activas"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-naval-800"
          >
            Lotes Activos
          </TabsTrigger>
          <TabsTrigger value="nueva" className="flex-1 data-[state=active]:bg-white data-[state=active]:text-naval-800">
            Nuevo Lote
          </TabsTrigger>
        </TabsList>
        <TabsContent value="activas" className="space-y-4 mt-6">
          <Card className="naval-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-naval-800">Lotes Activos</CardTitle>
              <CardDescription>Listado de lotes actualmente en uso en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <CajasActivas />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="nueva" className="space-y-4 mt-6">
          <Card className="naval-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-naval-800">Registrar Nuevo Lote</CardTitle>
              <CardDescription>Complete el formulario para registrar un nuevo lote en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <NuevaCajaForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
