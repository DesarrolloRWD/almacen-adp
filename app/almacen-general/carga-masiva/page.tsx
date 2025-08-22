import { FileSpreadsheet } from "lucide-react"
import CargaMasivaProductosForm from "@/components/zoques/carga-masiva-productos-form"

export default function CargaMasivaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-naval-800 flex items-center">
          <FileSpreadsheet className="mr-2 h-6 w-6 text-naval-600" />
          Carga Masiva de Productos
        </h1>
        <p className="text-muted-foreground">Importe múltiples productos desde un archivo Excel.</p>
      </div>

      <CargaMasivaProductosForm />
    </div>
  )
}
