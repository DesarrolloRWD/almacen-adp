import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProductosTable from "@/components/productos/productos-table"
import RegistrarProductoForm from "@/components/productos/registrar-producto-form"
import { Stethoscope, PlusCircle } from "lucide-react"

export default function ProductosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-naval-800 flex items-center">
          <Stethoscope className="mr-2 h-6 w-6 text-naval-600" />
          Gestión de Insumos Médicos
        </h1>
        <p className="text-muted-foreground">Administre el inventario de insumos médicos del Hospital Naval.</p>
      </div>

      {/* Se eliminó el botón de Registrar Insumo */}

      <Tabs defaultValue="listado" className="w-full">
        <TabsList className="bg-naval-50 text-naval-700 w-full md:w-[400px]">
          <TabsTrigger
            value="listado"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-naval-800"
          >
            Listado de Insumos
          </TabsTrigger>
          <TabsTrigger
            value="registrar"
            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-naval-800"
          >
            Registrar Insumo
          </TabsTrigger>
        </TabsList>
        <TabsContent value="listado" className="space-y-4 mt-6">
          <Card className="naval-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-naval-800">Insumos en Inventario</CardTitle>
              <CardDescription>Listado completo de insumos médicos registrados en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductosTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="registrar" className="space-y-4 mt-6">
          <Card className="naval-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-naval-800">Registrar Nuevo Insumo</CardTitle>
              <CardDescription>
                Complete el formulario para registrar un nuevo insumo médico en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrarProductoForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
