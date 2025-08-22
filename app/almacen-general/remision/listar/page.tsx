import { Metadata } from "next";
import { RemisionesTable } from "@/components/remisiones/remisiones-table";
import { History } from "lucide-react";

export const metadata: Metadata = {
  title: "Historial de remisiones | Almacén Naval",
  description: "Historial de remisiones del sistema de Almacén Naval",
};

export default function ListarRemisionesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <History className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Historial de remisiones</h2>
      </div>

      <RemisionesTable />
    </div>
  );
}
