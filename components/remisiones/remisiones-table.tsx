"use client";

import { useState, useEffect } from "react";
import { Remision, RemisionDetallada } from "@/lib/api";
import { getAllRemisiones, getRemisionByNumero } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { RemisionDetalleModal } from "./remision-detalle-modal";
import { useToast } from "@/components/ui/use-toast";

export function RemisionesTable() {
  const [remisiones, setRemisiones] = useState<Remision[]>([]);
  const [filteredRemisiones, setFilteredRemisiones] = useState<Remision[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRemision, setSelectedRemision] = useState<RemisionDetallada | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRemisiones = async () => {
      try {
        setIsLoading(true);
        const data = await getAllRemisiones();
        setRemisiones(data);
        setFilteredRemisiones(data);
        setError(null);
      } catch (err) {
        console.error("Error al cargar remisiones:", err);
        setError("Error al cargar las remisiones. Intente nuevamente más tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRemisiones();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRemisiones(remisiones);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = remisiones.filter(
      (remision) =>
        remision.ordenRemision.toLowerCase().includes(searchTermLower) ||
        remision.hospital.toLowerCase().includes(searchTermLower) ||
        remision.tipoSalida.toLowerCase().includes(searchTermLower) ||
        remision.almacenProveniente.toLowerCase().includes(searchTermLower)
    );
    setFilteredRemisiones(filtered);
  }, [searchTerm, remisiones]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return dateString;
    }
  };
  
  const handleVerDetalle = async (ordenRemision: string) => {
    try {
      setIsLoadingDetails(true);
      const remisionDetallada = await getRemisionByNumero(ordenRemision);
      
      if (remisionDetallada) {
        setSelectedRemision(remisionDetallada);
        setIsModalOpen(true);
      } else {
        toast({
          title: "Error",
          description: "No se pudo obtener el detalle de la remisión",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error al obtener detalle de remisión:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar los detalles de la remisión",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRemision(null);
  };

  return (
    <Card className="naval-card">
      <CardHeader className="flex flex-row items-center justify-between">
        {/* <CardTitle>Historial de remisiones</CardTitle> */}
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar remisiones..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">{error}</div>
        ) : filteredRemisiones.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            {searchTerm.trim() !== "" ? "No se encontraron remisiones que coincidan con la búsqueda." : "No hay remisiones disponibles."}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Orden de Remisión</TableHead>
                  <TableHead>Fecha de Salida</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Tipo de Salida</TableHead>
                  <TableHead>Almacén Proveniente</TableHead>
                  <TableHead className="w-[100px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRemisiones.map((remision) => (
                  <TableRow key={remision.ordenRemision}>
                    <TableCell className="font-medium">{remision.ordenRemision}</TableCell>
                    <TableCell>{formatDate(remision.fechaSalida)}</TableCell>
                    <TableCell>{remision.hospital}</TableCell>
                    <TableCell>{remision.tipoSalida}</TableCell>
                    <TableCell>{remision.almacenProveniente}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleVerDetalle(remision.ordenRemision)}
                        disabled={isLoadingDetails}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {/* Modal para mostrar detalles de la remisión */}
      <RemisionDetalleModal 
        remision={selectedRemision} 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
      />
    </Card>
  );
}
