"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Filter, Loader2, PackageOpen, Calendar, Download, FileDown, ArrowUpDown, Clock, AlertTriangle } from "lucide-react"
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
import { Card, CardContent } from "@/components/ui/card"
import { ProductoAgotado, ProductoExpirado } from "@/types/historial"

interface HistorialSalidasProps {
  tipoHistorialSeleccionado?: 'agotados' | 'expirados';
}

export default function HistorialSalidas({ tipoHistorialSeleccionado = 'agotados' }: HistorialSalidasProps) {
  // Estado para controlar qué tipo de historial se muestra
  const [tipoHistorial, setTipoHistorial] = useState<'agotados' | 'expirados'>(tipoHistorialSeleccionado)
  
  // Estados para manejar los datos y la paginación
  const [productosAgotados, setProductosAgotados] = useState<ProductoAgotado[]>([])
  const [productosExpirados, setProductosExpirados] = useState<ProductoExpirado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredProductosAgotados, setFilteredProductosAgotados] = useState<ProductoAgotado[]>([])
  const [filteredProductosExpirados, setFilteredProductosExpirados] = useState<ProductoExpirado[]>([])
  const [filterDivision, setFilterDivision] = useState<string>('all')
  const [filterLinea, setFilterLinea] = useState<string>('all')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filterDate, setFilterDate] = useState<string>('')
  const [generatingPDF, setGeneratingPDF] = useState(false)
  
  // Función para cargar los productos agotados
  const fetchProductosAgotados = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/historial/agotados', {
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
      setProductosAgotados(Array.isArray(data) ? data : [])
      setError(null)
    } catch (error) {
      console.error("Error al obtener historial de productos agotados:", error)
      setError("Error al cargar el historial. Por favor, intente nuevamente.")
      toast.error("Error al cargar el historial de productos agotados")
    } finally {
      setLoading(false)
    }
  }
  
  // Función para cargar los productos expirados
  const fetchProductosExpirados = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/historial/expirados', {
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
      setProductosExpirados(Array.isArray(data) ? data : [])
      setError(null)
    } catch (error) {
      console.error("Error al obtener historial de productos expirados:", error)
      setError("Error al cargar el historial. Por favor, intente nuevamente.")
      toast.error("Error al cargar el historial de productos expirados")
    } finally {
      setLoading(false)
    }
  }
  
  // Cargar datos iniciales
  
  // Función para formatear fechas, manejando valores nulos o indefinidos
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return 'Fecha inválida';
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  }
  
  // Efecto para actualizar tipoHistorial cuando cambia la prop
  useEffect(() => {
    setTipoHistorial(tipoHistorialSeleccionado)
  }, [tipoHistorialSeleccionado])
  
  // Efecto para cargar datos según el tipo seleccionado
  useEffect(() => {
    // Cargar datos según el tipo seleccionado
    if (tipoHistorial === 'agotados') {
      fetchProductosAgotados()
    } else {
      fetchProductosExpirados()
    }
    // Resetear la página al cambiar de tipo
    setCurrentPage(1)
  }, [tipoHistorial])
  
  // Filtrar productos agotados cuando cambia el término de búsqueda o los filtros
  useEffect(() => {
    if (tipoHistorial === 'agotados') {
      let filtered = productosAgotados.filter(producto => {
        const matchesSearch = searchTerm === '' || 
          producto.payload.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producto.payload.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producto.payload.division.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producto.payload.linea.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producto.payload.sublinea.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producto.payload.lote.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesDivision = filterDivision === 'all' || 
          producto.payload.division === filterDivision
        
        const matchesLinea = filterLinea === 'all' || 
          producto.payload.linea === filterLinea
        
        const matchesDate = filterDate === '' || 
          (producto.payload.fechaEliminacion && 
           isValid(parseISO(producto.payload.fechaEliminacion)) && 
           format(parseISO(producto.payload.fechaEliminacion), 'yyyy-MM-dd') === filterDate)
        
        return matchesSearch && matchesDivision && matchesLinea && matchesDate
      })
      
      // Ordenar por fecha de eliminación
      filtered = filtered.sort((a, b) => {
        if (!a.payload.fechaEliminacion) return 1
        if (!b.payload.fechaEliminacion) return -1
        
        const dateA = parseISO(a.payload.fechaEliminacion)
        const dateB = parseISO(b.payload.fechaEliminacion)
        
        if (!isValid(dateA)) return 1
        if (!isValid(dateB)) return -1
        
        return sortDirection === 'desc' ? 
          compareDesc(dateA, dateB) : 
          compareAsc(dateA, dateB)
      })
      
      setFilteredProductosAgotados(filtered)
    }
  }, [productosAgotados, searchTerm, filterDivision, filterLinea, filterDate, sortDirection, tipoHistorial])
  
  // Filtrar productos expirados cuando cambia el término de búsqueda o los filtros
  useEffect(() => {
    if (tipoHistorial === 'expirados') {
      let filtered = productosExpirados.filter(producto => {
        const matchesSearch = searchTerm === '' || 
          producto.payload.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producto.payload.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producto.payload.division.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producto.payload.linea.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producto.payload.sublinea.toLowerCase().includes(searchTerm.toLowerCase()) ||
          producto.payload.lote.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesDivision = filterDivision === 'all' || 
          producto.payload.division === filterDivision
        
        const matchesLinea = filterLinea === 'all' || 
          producto.payload.linea === filterLinea
        
        const matchesDate = filterDate === '' || 
          (producto.payload.fechaExpiracion && 
           isValid(parseISO(producto.payload.fechaExpiracion)) && 
           format(parseISO(producto.payload.fechaExpiracion), 'yyyy-MM-dd') === filterDate)
        
        return matchesSearch && matchesDivision && matchesLinea && matchesDate
      })
      
      // Ordenar por fecha de expiración
      filtered = filtered.sort((a, b) => {
        if (!a.payload.fechaExpiracion) return 1
        if (!b.payload.fechaExpiracion) return -1
        
        const dateA = parseISO(a.payload.fechaExpiracion)
        const dateB = parseISO(b.payload.fechaExpiracion)
        
        if (!isValid(dateA)) return 1
        if (!isValid(dateB)) return -1
        
        return sortDirection === 'desc' ? 
          compareDesc(dateA, dateB) : 
          compareAsc(dateA, dateB)
      })
      
      setFilteredProductosExpirados(filtered)
    }
  }, [productosExpirados, searchTerm, filterDivision, filterLinea, filterDate, sortDirection, tipoHistorial])
  
  // Calcular índices para paginación según el tipo de historial
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  
  // Determinar qué lista filtrada usar según el tipo de historial
  const filteredProductos = tipoHistorial === 'agotados' ? filteredProductosAgotados : filteredProductosExpirados
  const currentItems = filteredProductos.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage)
  
  // Obtener valores únicos para los filtros según el tipo de historial
  const productos = tipoHistorial === 'agotados' ? productosAgotados : productosExpirados
  const divisiones = [...new Set(productos.map((p: any) => p.payload.division))].filter(Boolean)
  const lineas = [...new Set(productos.map((p: any) => p.payload.linea))].filter(Boolean)
  
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
  
  // Esta función formatDate ha sido movida arriba para evitar duplicación
  
  // Generar PDF para un solo producto
  const generateProductPDF = (producto: ProductoAgotado | ProductoExpirado) => {
    setGeneratingPDF(true)
    try {
      const doc = new jsPDF()
      
      // Determinar el tipo de producto
      const esAgotado = tipoHistorial === 'agotados';
      
      // Título
      doc.setFontSize(18)
      doc.text(`Informe de Producto ${esAgotado ? 'Agotado' : 'Expirado'}`, 14, 22)
      
      // Fecha del informe
      doc.setFontSize(11)
      doc.text(`Fecha del informe: ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}`, 14, 32)
      
      // Información del producto
      doc.setFontSize(14)
      doc.text("Datos del Producto", 14, 45)
      
      // Crear datos según el tipo de producto
      let productData: Array<[string, string]> = [];
      
      if (esAgotado) {
        // Es un producto agotado
        const productoAgotado = producto as ProductoAgotado;
        productData = [
          ["Código", productoAgotado.payload.codigo],
          ["Descripción", productoAgotado.payload.descripcion],
          ["Marca", productoAgotado.payload.marca],
          ["División", productoAgotado.payload.division],
          ["Línea", productoAgotado.payload.linea],
          ["Unidad", productoAgotado.payload.unidadBase || "CAJA"],
          ["Lote", productoAgotado.payload.lote],
          ["Fecha de eliminación", formatDate(productoAgotado.payload.fechaEliminacion)]
        ];
      } else {
        // Es un producto expirado
        const productoExpirado = producto as ProductoExpirado;
        productData = [
          ["Código", productoExpirado.payload.codigo],
          ["Descripción", productoExpirado.payload.descripcion],
          ["División", productoExpirado.payload.division],
          ["Línea", productoExpirado.payload.linea],
          ["Lote", productoExpirado.payload.lote],
          ["Fecha de expiración", formatDate(productoExpirado.payload.fechaExpiracion)],
          ["Fecha de eliminación", productoExpirado.payload.fechaEliminacion ? formatDate(productoExpirado.payload.fechaEliminacion) : 'N/A'],
          ["Motivo", productoExpirado.payload.motivo || 'N/A'],
          ["Eliminado por", productoExpirado.payload.eliminadoPor || 'N/A']
        ];
      }
      
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
      // Filtrar productos por la fecha seleccionada según el tipo de historial
      const productosPorDia = tipoHistorial === 'agotados'
        ? filteredProductosAgotados.filter(p => {
            if (!p.payload.fechaEliminacion) return false;
            
            try {
              const fechaProducto = format(parseISO(p.payload.fechaEliminacion), 'yyyy-MM-dd');
              return fechaProducto === date;
            } catch (error) {
              return false;
            }
          })
        : filteredProductosExpirados.filter(p => {
            // Para productos expirados, usar fechaExpiracion o fechaEliminacion
            const fechaAComparar = p.payload.fechaExpiracion || p.payload.fechaEliminacion;
            if (!fechaAComparar) return false;
            
            try {
              const fechaProducto = format(parseISO(fechaAComparar), 'yyyy-MM-dd');
              return fechaProducto === date;
            } catch (error) {
              return false;
            }
          });
      
      if (productosPorDia.length === 0) {
        toast.error("No hay productos para la fecha seleccionada")
        setGeneratingPDF(false)
        return
      }
      
      const doc = new jsPDF()
      
      // Título según tipo de historial
      doc.setFontSize(18)
      doc.text(`Informe de Productos ${tipoHistorial === 'agotados' ? 'Agotados' : 'Expirados'} - ${date}`, 14, 22)
      
      // Fecha del informe
      doc.setFontSize(11)
      doc.text(`Fecha del informe: ${format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })}`, 14, 32)
      doc.text(`Total de productos: ${productosPorDia.length}`, 14, 38)
      
      // Definir encabezados y datos para la tabla según tipo de historial
      let headers: string[] = [];
      let tableData: string[][] = [];
      
      if (tipoHistorial === 'agotados') {
        // Encabezados para productos agotados
        headers = ["Código", "Descripción", "Marca", "División", "Unidad", "Lote"];
        
        // Datos para productos agotados
        tableData = productosPorDia.map(p => {
          const producto = p as ProductoAgotado;
          return [
            producto.payload.codigo,
            producto.payload.descripcion.length > 30 ? producto.payload.descripcion.substring(0, 30) + '...' : producto.payload.descripcion,
            producto.payload.marca,
            producto.payload.division,
            producto.payload.unidadBase || "CAJA",
            producto.payload.lote
          ];
        });
      } else {
        // Encabezados para productos expirados (sin columnas Unidad ni Marca)
        headers = ["Código", "Descripción", "División", "Lote"];
        
        // Datos para productos expirados
        tableData = productosPorDia.map(p => {
          const producto = p as ProductoExpirado;
          return [
            producto.payload.codigo,
            producto.payload.descripcion.length > 30 ? producto.payload.descripcion.substring(0, 30) + '...' : producto.payload.descripcion,
            producto.payload.division,
            producto.payload.lote
          ];
        });
      }
      
      // Usar autoTable como función independiente
      autoTable(doc, {
        startY: 45,
        head: [headers],
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
      
      // Guardar el PDF con nombre según tipo de historial
      doc.save(`Productos_${tipoHistorial === 'agotados' ? 'Agotados' : 'Expirados'}_${date}.pdf`)
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
                <div className="max-h-[300px] overflow-y-auto">
                  {divisionesOrdenadas.map((division) => {
                    const colorStyle = getColorDivision(division);
                    return (
                      <SelectItem key={division} value={division}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: colorStyle.color }}
                          />
                          <span>{division}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </div>
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
      ) : (tipoHistorial === 'agotados' ? filteredProductosAgotados : filteredProductosExpirados).length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {tipoHistorial === 'agotados' ? (
            <>
              <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2">No se encontraron registros de productos agotados.</p>
            </>
          ) : (
            <>
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2">No se encontraron registros de productos expirados.</p>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Tabla de productos */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-naval-50">
                  {tipoHistorial === 'agotados' && (
                    <TableHead className="font-semibold text-naval-800">Unidad</TableHead>
                  )}
                  <TableHead className="font-semibold text-naval-800">Código</TableHead>
                  <TableHead className="font-semibold text-naval-800">Lote</TableHead>
                  {tipoHistorial === 'agotados' && (
                    <TableHead className="font-semibold text-naval-800">Marca</TableHead>
                  )}
                  <TableHead className="font-semibold text-naval-800">Division</TableHead>
                  <TableHead className="font-semibold text-naval-800">Descripción</TableHead>
                  <TableHead className="font-semibold text-naval-800">Fecha</TableHead>
                  <TableHead className="font-semibold text-naval-800">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.map((producto, index) => {
                  // Determinar si es producto agotado o expirado
                  const esAgotado = tipoHistorial === 'agotados';
                  const fechaMostrar = esAgotado 
                    ? producto.payload.fechaEliminacion 
                    : ((producto as ProductoExpirado).payload.fechaExpiracion || (producto as ProductoExpirado).payload.fechaEliminacion || '');
                  
                  return (
                    <TableRow key={`${producto.payload.codigo}-${producto.payload.lote}-${index}`}>
                      {esAgotado && (
                        <TableCell>
                          {(producto as ProductoAgotado).payload.unidadBase || "CAJA"}
                        </TableCell>
                      )}
                      <TableCell>{producto.payload.codigo}</TableCell>
                      <TableCell>{producto.payload.lote}</TableCell>
                      {esAgotado && (
                        <TableCell>
                          {(producto as ProductoAgotado).payload.marca}
                        </TableCell>
                      )}
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
                          {formatDate(fechaMostrar)}
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
                  );
                })}
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
