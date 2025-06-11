"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Filter, Loader2, PackageOpen, Calendar, Download, FileDown, ArrowUpDown } from "lucide-react"
import { format, parseISO, isValid, compareDesc, compareAsc } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

// Interfaz para productos agotados del historial
interface ProductoAgotado {
  type: string;
  payload: {
    codigo: string;
    descripcion: string;
    marca: string;
    unidadBase: string;
    division: string;
    linea: string;
    sublinea: string;
    lote: string;
    fechaEliminacion: string;
  };
  timestamp: number;
  source: string;
  correlationId: string;
  routingKey: string;
}

export default function HistorialSalidas() {
  // Estados para manejar los datos y la paginación
  const [productos, setProductos] = useState<ProductoAgotado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProductos, setFilteredProductos] = useState<ProductoAgotado[]>([])
  const [filterDivision, setFilterDivision] = useState<string>('all')
  const [filterLinea, setFilterLinea] = useState<string>('all')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filterDate, setFilterDate] = useState<string>('')
  const [generatingPDF, setGeneratingPDF] = useState(false)
  
  // Obtener datos del historial
  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/historial', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        })
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`)
        }
        
        const data = await response.json()
        setProductos(Array.isArray(data) ? data : [])
        setError(null)
      } catch (error) {
        console.error("Error al obtener historial de productos agotados:", error)
        setError("Error al cargar el historial. Por favor, intente nuevamente.")
        toast.error("Error al cargar el historial de salidas")
      } finally {
        setLoading(false)
      }
    }
    
    fetchHistorial()
  }, [])
  
  // Filtrar productos cuando cambia el término de búsqueda o los filtros
  useEffect(() => {
    let filtered = productos.filter(producto => {
      const matchesSearch = searchTerm === '' || 
        producto.payload.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.payload.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.payload.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.payload.lote.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesDivision = filterDivision === 'all' || 
        producto.payload.division === filterDivision
        
      // Filtrar por fecha si se ha seleccionado una
      let matchesDate = true
      if (filterDate) {
        try {
          // Convertir la fecha del producto a formato ISO para comparación
          const fechaProducto = parseISO(producto.payload.fechaEliminacion)
          // Convertir la fecha del filtro a objeto Date
          const fechaFiltro = parseISO(filterDate)
          
          // Comparar solo año, mes y día
          matchesDate = (
            fechaProducto.getFullYear() === fechaFiltro.getFullYear() &&
            fechaProducto.getMonth() === fechaFiltro.getMonth() &&
            fechaProducto.getDate() === fechaFiltro.getDate()
          )
        } catch (error) {
          matchesDate = false
        }
      }
      
      return matchesSearch && matchesDivision && matchesDate
    })
    
    // Ordenar por fecha
    filtered = [...filtered].sort((a, b) => {
      const dateA = parseISO(a.payload.fechaEliminacion)
      const dateB = parseISO(b.payload.fechaEliminacion)
      
      if (!isValid(dateA) || !isValid(dateB)) return 0
      
      return sortDirection === 'asc' 
        ? compareAsc(dateA, dateB) 
        : compareDesc(dateA, dateB)
    })
    
    setFilteredProductos(filtered)
    setCurrentPage(1) // Resetear a la primera página cuando cambian los filtros
  }, [searchTerm, filterDivision, filterDate, sortDirection, productos])
  
  // Calcular índices para paginación
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredProductos.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage)
  
  // Obtener valores únicos para los filtros
  const divisiones = [...new Set(productos.map(p => p.payload.division))].filter(Boolean)
  const lineas = [...new Set(productos.map(p => p.payload.linea))].filter(Boolean)
  
  // Lista de divisiones en el orden correcto según la imagen
  const divisionesOrdenadas = [
    "COAGULACIÓN",
    "FRACCIONAMIENTO",
    "TOMA DE MUESTRA/SANGRADO",
    "INMUNOHEMATOLOGIA",
    "CONFIRMATORIAS",
    "NAT",
    "NAT PANTHER",
    "HEMATOLOGÍA",
    "SEROLOGÍA",
    "BIOLOGIA MOLECULAR",
    "CITOMETRÍA"
  ]
  
  // Mapa de colores para divisiones con estilos personalizados
  const colorMap: {[key: string]: {bg: string, text: string, border: string, color: string}} = {
    // COAGULACIÓN - Turquesa
    "COAGULACIÓN": {bg: "bg-[#40E0D0]/20", text: "text-[#008080]", border: "border-[#40E0D0]", color: "#40E0D0"},
    // FRACCIONAMIENTO - Azul claro
    "FRACCIONAMIENTO": {bg: "bg-[#87CEEB]/20", text: "text-[#1E90FF]", border: "border-[#87CEEB]", color: "#87CEEB"},
    // TOMA DE MUESTRA/SANGRADO - Amarillo
    "TOMA DE MUESTRA/SANGRADO": {bg: "bg-[#FFD700]/20", text: "text-[#B8860B]", border: "border-[#FFD700]", color: "#FFD700"},
    // INMUNOHEMATOLOGÍA - Gris claro
    "INMUNOHEMATOLOGIA": {bg: "bg-[#D3D3D3]/20", text: "text-[#696969]", border: "border-[#D3D3D3]", color: "#D3D3D3"},
    "INMUNOHEMATOLOGÍA": {bg: "bg-[#D3D3D3]/20", text: "text-[#696969]", border: "border-[#D3D3D3]", color: "#D3D3D3"},
    // CONFIRMATORIAS - Rosa claro
    "CONFIRMATORIAS": {bg: "bg-[#FF9999]/20", text: "text-[#DC143C]", border: "border-[#FF9999]", color: "#FF9999"},
    // NAT - Salmón
    "NAT": {bg: "bg-[#FFA07A]/20", text: "text-[#FF4500]", border: "border-[#FFA07A]", color: "#FFA07A"},
    // NAT PANTHER - Marrón
    "NAT PANTHER": {bg: "bg-[#A0522D]/20", text: "text-[#8B4513]", border: "border-[#A0522D]", color: "#A0522D"},
    // HEMATOLOGÍA - Verde claro
    "HEMATOLOGIA": {bg: "bg-[#90EE90]/20", text: "text-[#228B22]", border: "border-[#90EE90]", color: "#90EE90"},
    "HEMATOLOGÍA": {bg: "bg-[#90EE90]/20", text: "text-[#228B22]", border: "border-[#90EE90]", color: "#90EE90"},
    // SEROLOGÍA - Azul medio
    "SEROLOGIA": {bg: "bg-[#6495ED]/20", text: "text-[#4169E1]", border: "border-[#6495ED]", color: "#6495ED"},
    "SEROLOGÍA": {bg: "bg-[#6495ED]/20", text: "text-[#4169E1]", border: "border-[#6495ED]", color: "#6495ED"},
    // BIOLOGIA MOLECULAR - Gris oscuro
    "BIOLOGIA MOLECULAR": {bg: "bg-[#708090]/20", text: "text-[#2F4F4F]", border: "border-[#708090]", color: "#708090"},
    // CITOMETRÍA - Lavanda
    "CITOMETRIA": {bg: "bg-[#DDA0DD]/20", text: "text-[#9932CC]", border: "border-[#DDA0DD]", color: "#DDA0DD"},
    "CITOMETRÍA": {bg: "bg-[#DDA0DD]/20", text: "text-[#9932CC]", border: "border-[#DDA0DD]", color: "#DDA0DD"},
    // Añadir variantes sin acentos y en minúsculas para mayor compatibilidad
    "REACTIVO": {bg: "bg-[#6495ED]/20", text: "text-[#4169E1]", border: "border-[#6495ED]", color: "#6495ED"},
    "REACTIVO DE LABORATORIO": {bg: "bg-[#6495ED]/20", text: "text-[#4169E1]", border: "border-[#6495ED]", color: "#6495ED"},
    "INSUMO DE LABORATORIO": {bg: "bg-[#FFD700]/20", text: "text-[#B8860B]", border: "border-[#FFD700]", color: "#FFD700"},
    "Soluciones": {bg: "bg-[#87CEEB]/20", text: "text-[#1E90FF]", border: "border-[#87CEEB]", color: "#87CEEB"},
    "TOMA DE MUESTRA": {bg: "bg-[#FFD700]/20", text: "text-[#B8860B]", border: "border-[#FFD700]", color: "#FFD700"}
  };
  
  // Obtener colores para una división
  const getColorDivision = (division: string) => {
    if (!division) return {bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-100", color: "#D3D3D3"};
    
    // Primero intentar con el nombre exacto
    if (colorMap[division]) {
      return colorMap[division];
    }
    
    // Si no se encuentra, intentar con variaciones
    // 1. Normalizar (quitar acentos)
    const normalizedDivision = division.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (colorMap[normalizedDivision]) {
      return colorMap[normalizedDivision];
    }
    
    // 2. Probar con mayúsculas
    if (colorMap[division.toUpperCase()]) {
      return colorMap[division.toUpperCase()];
    }
    
    // 3. Probar con normalizado y mayúsculas
    if (colorMap[normalizedDivision.toUpperCase()]) {
      return colorMap[normalizedDivision.toUpperCase()];
    }
    
    // 4. Buscar coincidencias parciales
    for (const key in colorMap) {
      if (division.includes(key) || key.includes(division)) {
        return colorMap[key];
      }
    }
    
    // Valor por defecto si no se encuentra
    return {bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-100", color: "#D3D3D3"};
  };
  
  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: es })
    } catch (error) {
      return dateString
    }
  }
  
  // Generar PDF para un solo producto
  const generateProductPDF = (producto: ProductoAgotado) => {
    setGeneratingPDF(true)
    try {
      const doc = new jsPDF()
      
      // Título
      doc.setFontSize(18)
      doc.text("Informe de Producto Agotado", 14, 22)
      
      // Fecha del informe
      doc.setFontSize(11)
      doc.text(`Fecha del informe: ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}`, 14, 32)
      
      // Información del producto
      doc.setFontSize(14)
      doc.text("Datos del Producto", 14, 45)
      
      const productData = [
        ["Código", producto.payload.codigo],
        ["Descripción", producto.payload.descripcion],
        ["Marca", producto.payload.marca],
        ["División", producto.payload.division],
        ["Línea", producto.payload.linea],
        ["Lote", producto.payload.lote],
        ["Fecha de eliminación", formatDate(producto.payload.fechaEliminacion)]
      ]
      
      // Usar autoTable como función independiente
      autoTable(doc, {
        startY: 50,
        head: [["Atributo", "Valor"]],
        body: productData,
        theme: 'striped',
        headStyles: { fillColor: [0, 48, 87] }
      })
      
      // Guardar el PDF
      doc.save(`Producto_${producto.payload.codigo}_${producto.payload.lote}.pdf`)
      toast.success("PDF generado correctamente")
    } catch (error) {
      console.error("Error al generar PDF:", error)
      toast.error("Error al generar el PDF")
    } finally {
      setGeneratingPDF(false)
    }
  }
  
  // Generar PDF para productos filtrados por día
  const generateDailyPDF = (date: string) => {
    setGeneratingPDF(true)
    try {
      // Filtrar productos por la fecha seleccionada
      const productosPorDia = filteredProductos.filter(p => {
        if (!p.payload.fechaEliminacion) return false
        
        try {
          // Convertir la fecha del producto a formato ISO
          const fechaProducto = parseISO(p.payload.fechaEliminacion)
          // Convertir la fecha del filtro
          const fechaFiltro = parseISO(date)
          
          // Comparar solo año, mes y día
          return (
            fechaProducto.getFullYear() === fechaFiltro.getFullYear() &&
            fechaProducto.getMonth() === fechaFiltro.getMonth() &&
            fechaProducto.getDate() === fechaFiltro.getDate()
          )
        } catch (error) {
          return false
        }
      })
      
      if (productosPorDia.length === 0) {
        toast.error("No hay productos para la fecha seleccionada")
        setGeneratingPDF(false)
        return
      }
      
      const doc = new jsPDF()
      
      // Título
      doc.setFontSize(18)
      doc.text(`Informe de Productos Agotados - ${date}`, 14, 22)
      
      // Fecha del informe
      doc.setFontSize(11)
      doc.text(`Fecha del informe: ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}`, 14, 32)
      doc.text(`Total de productos: ${productosPorDia.length}`, 14, 38)
      
      // Datos para la tabla
      const tableData = productosPorDia.map(p => [
        p.payload.codigo,
        p.payload.descripcion.length > 30 ? p.payload.descripcion.substring(0, 30) + '...' : p.payload.descripcion,
        p.payload.marca,
        p.payload.division,
        p.payload.unidadBase || "CAJA",
        p.payload.lote
      ])
      
      // Usar autoTable como función independiente
      autoTable(doc, {
        startY: 45,
        head: [["Código", "Descripción", "Marca", "División", "Unidad", "Lote"]],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 48, 87] },
        didDrawPage: (data: any) => {
          // Agregar pie de página
          doc.setFontSize(10)
          doc.text(
            `Página ${doc.getNumberOfPages()}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: "center" }
          )
        }
      })
      
      // Guardar el PDF
      doc.save(`Productos_Agotados_${date}.pdf`)
      toast.success("PDF generado correctamente")
    } catch (error) {
      console.error("Error al generar PDF:", error)
      toast.error("Error al generar el PDF")
    } finally {
      setGeneratingPDF(false)
    }
  }
  
  // Cambiar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1))
  const firstPage = () => setCurrentPage(1)
  const lastPage = () => setCurrentPage(totalPages)
  
  // Renderizar componente
  return (
    <div className="space-y-4">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filterDivision} onValueChange={setFilterDivision}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Todas las divisiones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las divisiones</SelectItem>
                {divisiones.map((division) => (
                  <SelectItem key={division} value={division}>
                    {division}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-[150px]"
            title="Filtrar por fecha"
          />
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            title={`Ordenar por fecha ${sortDirection === 'asc' ? 'descendente' : 'ascendente'}`}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={generatingPDF} title="Descargar informe">
                {generatingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => filterDate ? generateDailyPDF(filterDate) : toast.error("Seleccione una fecha para generar el informe")}
                disabled={generatingPDF}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Informe por día
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Estado de carga */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-naval-600" />
          <span className="ml-2 text-naval-600">Cargando historial...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()} 
            className="mt-2"
          >
            Reintentar
          </Button>
        </div>
      ) : filteredProductos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2">No se encontraron registros de productos agotados.</p>
        </div>
      ) : (
        <>
          {/* Tabla de productos */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-naval-50">
                  <TableHead className="font-semibold text-naval-800">Unidad</TableHead>
                  <TableHead className="font-semibold text-naval-800">Código</TableHead>
                  <TableHead className="font-semibold text-naval-800">Lote</TableHead>
                  <TableHead className="font-semibold text-naval-800">Marca</TableHead>
                  <TableHead className="font-semibold text-naval-800">Division</TableHead>
                  <TableHead className="font-semibold text-naval-800">Descripción</TableHead>
                  <TableHead className="font-semibold text-naval-800">Fecha</TableHead>
                  <TableHead className="font-semibold text-naval-800">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((producto, index) => (
                  <TableRow key={`${producto.payload.codigo}-${producto.payload.lote}-${index}`}>
                    <TableCell>
                      {producto.payload.unidadBase || "CAJA"}
                    </TableCell>
                    <TableCell>{producto.payload.codigo}</TableCell>
                    <TableCell>{producto.payload.lote}</TableCell>
                    <TableCell>{producto.payload.marca}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: getColorDivision(producto.payload.division).color }}
                        />
                        <span>{producto.payload.division}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[250px] truncate" title={producto.payload.descripcion}>
                      {producto.payload.descripcion}
                    </TableCell>
                    <TableCell>
                      <div className="whitespace-nowrap">
                        {formatDate(producto.payload.fechaEliminacion)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => generateProductPDF(producto)}
                        disabled={generatingPDF}
                        title="Descargar informe de este producto"
                      >
                        <FileDown className="h-4 w-4 text-blue-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Información de registros */}
          <div className="flex items-center justify-end mt-4">
            <p className="text-sm text-muted-foreground">
              Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredProductos.length)} de {filteredProductos.length} registros
            </p>
          </div>
        </>
      )}
    </div>
  )
}
