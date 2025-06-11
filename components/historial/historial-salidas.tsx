"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, PackageOpen, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { format } from "date-fns"
import { api } from "@/lib/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Interfaces para tipado
interface Producto {
  codigo: string;
  descripcion: string;
  catalogo: string;
}

interface Usuario {
  nombre: string;
  avatar: string;
  iniciales: string;
  departamento: string;
}

interface Salida {
  id: number;
  fecha: string;
  producto: Producto;
  cantidad: number;
  lote: string;
  area: string;
  usuario: Usuario;
  comentario?: string;
}

// Datos de ejemplo para mostrar en la tabla mientras se implementa la API real
const salidasEjemplo: Salida[] = [
  {
    id: 1,
    fecha: new Date().toISOString(),
    producto: {
      codigo: "MED001",
      descripcion: "Paracetamol 500mg",
      catalogo: "Analgésicos"
    },
    cantidad: 100,
    lote: "L2023-001",
    area: "Farmacia",
    usuario: {
      nombre: "Juan Pérez",
      avatar: "",
      iniciales: "JP",
      departamento: "Farmacia"
    },
    comentario: "Entrega mensual"
  },
  {
    id: 2,
    fecha: new Date(Date.now() - 86400000).toISOString(), // Un día antes
    producto: {
      codigo: "MED002",
      descripcion: "Ibuprofeno 400mg",
      catalogo: "Antiinflamatorios"
    },
    cantidad: 50,
    lote: "L2023-002",
    area: "Urgencias",
    usuario: {
      nombre: "María López",
      avatar: "",
      iniciales: "ML",
      departamento: "Urgencias"
    }
  }
];

export default function HistorialSalidas() {
  // Estados para la tabla de salidas
  const [salidas, setSalidas] = useState<Salida[]>(salidasEjemplo);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  
  // Estados para filtros
  const [filtroProducto, setFiltroProducto] = useState("");
  const [filtroArea, setFiltroArea] = useState("");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
  const [filtroFechaFin, setFiltroFechaFin] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(10);
  
  // Calcular salidas filtradas
  const salidasFiltradas = salidas.filter(salida => {
    // Filtro por producto (código o descripción)
    const matchProducto = filtroProducto === "" || 
      salida.producto.codigo.toLowerCase().includes(filtroProducto.toLowerCase()) ||
      salida.producto.descripcion.toLowerCase().includes(filtroProducto.toLowerCase());
    
    // Filtro por área
    const matchArea = filtroArea === "" || 
      salida.area.toLowerCase().includes(filtroArea.toLowerCase());
    
    // Filtro por fecha de inicio
    const fechaSalida = new Date(salida.fecha);
    const matchFechaInicio = filtroFechaInicio === "" || 
      fechaSalida >= new Date(filtroFechaInicio);
    
    // Filtro por fecha de fin
    const matchFechaFin = filtroFechaFin === "" || 
      fechaSalida <= new Date(filtroFechaFin);
    
    return matchProducto && matchArea && matchFechaInicio && matchFechaFin;
  });
  
  // Calcular índices para paginación
  const indexUltimoItem = paginaActual * itemsPorPagina;
  const indexPrimerItem = indexUltimoItem - itemsPorPagina;
  const itemsActuales = salidasFiltradas.slice(indexPrimerItem, indexUltimoItem);
  
  // Calcular número total de páginas
  const totalPaginas = Math.ceil(salidasFiltradas.length / itemsPorPagina);
  
  // Función para cambiar de página
  const cambiarPagina = (numeroPagina: number) => {
    setPaginaActual(numeroPagina);
  };
  
  // Función para ir a la primera página
  const irPrimeraPagina = () => {
    setPaginaActual(1);
  };
  
  // Función para ir a la última página
  const irUltimaPagina = () => {
    setPaginaActual(totalPaginas);
  };
  
  // Función para ir a la página anterior
  const irPaginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
    }
  };
  
  // Función para ir a la página siguiente
  const irPaginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
    }
  };
  
  // Función para aplicar filtros
  const aplicarFiltros = () => {
    // Esta función se llamaría al hacer clic en un botón de filtrar
    // Por ahora, los filtros se aplican automáticamente en el cálculo de salidasFiltradas
    console.log("Aplicando filtros:", { filtroProducto, filtroArea, filtroFechaInicio, filtroFechaFin });
  };
  
  // Función para limpiar filtros
  const limpiarFiltros = () => {
    setFiltroProducto("");
    setFiltroArea("");
    setFiltroFechaInicio("");
    setFiltroFechaFin("");
  };
  
  // Función para exportar a PDF (implementación básica)
  const exportarPDF = () => {
    console.log("Exportando a PDF...");
    // Aquí iría la lógica para generar un PDF con los datos filtrados
  };
  
  // Efecto para cargar los datos de salidas al iniciar el componente
  useEffect(() => {
    const cargarSalidas = async () => {
      setCargando(true);
      setError("");
      
      try {
        // Aquí iría la llamada a la API para obtener las salidas
        // Por ahora, usamos los datos de ejemplo
        // const respuesta = await api.getHistorialSalidas();
        // setSalidas(respuesta);
        
        // Simulamos una carga con un timeout
        setTimeout(() => {
          setSalidas(salidasEjemplo);
          setCargando(false);
        }, 500);
      } catch (error) {
        console.error("Error al cargar historial de salidas:", error);
        setError("Ocurrió un error al cargar el historial de salidas");
        setCargando(false);
      }
    };
    
    cargarSalidas();
  }, []);
  
  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o descripción"
            className="pl-8"
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportarPDF}
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      
      {/* Panel de filtros avanzados */}
      {mostrarFiltros && (
        <div className="bg-muted/40 p-4 rounded-lg space-y-4">
          <h3 className="font-medium text-sm">Filtros avanzados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Área</label>
              <Input
                placeholder="Filtrar por área"
                value={filtroArea}
                onChange={(e) => setFiltroArea(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha desde</label>
              <Input
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha hasta</label>
              <Input
                type="date"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button 
                variant="default" 
                size="sm"
                className="flex-1"
                onClick={aplicarFiltros}
              >
                Aplicar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
                onClick={limpiarFiltros}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tabla de salidas */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Fecha</TableHead>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Comentario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cargando ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Cargando datos...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : itemsActuales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No se encontraron registros
                </TableCell>
              </TableRow>
            ) : (
              itemsActuales.map((salida) => (
                <TableRow key={salida.id}>
                  <TableCell>
                    {format(new Date(salida.fecha), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {salida.producto.codigo}
                    </Badge>
                  </TableCell>
                  <TableCell>{salida.producto.descripcion}</TableCell>
                  <TableCell>{salida.lote}</TableCell>
                  <TableCell>{salida.cantidad}</TableCell>
                  <TableCell>{salida.area}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="bg-naval-100 text-naval-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium">
                        {salida.usuario.iniciales}
                      </div>
                      <span>{salida.usuario.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {salida.comentario || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Paginación */}
      {!cargando && !error && salidasFiltradas.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Mostrando {indexPrimerItem + 1} a {Math.min(indexUltimoItem, salidasFiltradas.length)} de {salidasFiltradas.length} registros
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={irPrimeraPagina}
              disabled={paginaActual === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={irPaginaAnterior}
              disabled={paginaActual === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {paginaActual} de {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={irPaginaSiguiente}
              disabled={paginaActual === totalPaginas}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={irUltimaPagina}
              disabled={paginaActual === totalPaginas}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
            <Select
              value={itemsPorPagina.toString()}
              onValueChange={(value) => {
                setItemsPorPagina(Number(value));
                setPaginaActual(1);
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="10 por página" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 por página</SelectItem>
                <SelectItem value="10">10 por página</SelectItem>
                <SelectItem value="20">20 por página</SelectItem>
                <SelectItem value="50">50 por página</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
