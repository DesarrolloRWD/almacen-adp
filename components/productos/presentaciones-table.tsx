'use client'

import { useEffect, useState } from 'react'
import { Presentacion, getPresentaciones, getPresentacionEspecifica, generateEntrega, EntregaData } from '@/lib/api'
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter, ShoppingCart, Plus, Trash, X, Loader2, FileDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

export function PresentacionesTable() {
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([])
  const [presentacionesFiltradas, setPresentacionesFiltradas] = useState<Presentacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('todos')
  const [presentacionesSeleccionadas, setPresentacionesSeleccionadas] = useState<Presentacion[]>([])
  const [loadingPresentacion, setLoadingPresentacion] = useState(false)

  useEffect(() => {
    async function fetchPresentaciones() {
      try {
        setLoading(true)
        const data = await getPresentaciones()
        setPresentaciones(data)
        setPresentacionesFiltradas(data)
        setError(null)
      } catch (err) {
        console.error('Error al cargar presentaciones:', err)
        setError('No se pudieron cargar las presentaciones. Intente nuevamente más tarde.')
      } finally {
        setLoading(false)
      }
    }

    fetchPresentaciones()
  }, [])

  // Función para filtrar presentaciones
  useEffect(() => {
    let filtradas = presentaciones
    
    // Filtrar por búsqueda
    if (busqueda.trim() !== '') {
      const termino = busqueda.toLowerCase()
      filtradas = filtradas.filter(p => 
        (p.item?.codigo?.toLowerCase() || '').includes(termino) ||
        (p.item?.descripcion?.toLowerCase() || '').includes(termino) ||
        (p.tipoPresentacion?.toLowerCase() || '').includes(termino) ||
        (p.descripcionPresentacion?.toLowerCase() || '').includes(termino) ||
        (p.lote?.toLowerCase() || '').includes(termino)
      )
    }
    
    // Filtrar por tipo
    if (tipoSeleccionado !== 'todos') {
      filtradas = filtradas.filter(p => 
        (p.tipoPresentacion?.toLowerCase() || '') === tipoSeleccionado.toLowerCase()
      )
    }
    
    setPresentacionesFiltradas(filtradas)
  }, [busqueda, tipoSeleccionado, presentaciones])

  // Tipos predefinidos para el filtro
  const tiposPredefinidos = ['todos', 'PIEZA', 'CAJA', 'KIT']
  
  // Función para agregar una presentación al carrito
  const agregarPresentacion = async (id: number) => {
    try {
      setLoadingPresentacion(true)
      //////console.log('Obteniendo presentación con ID:', id) // Log para depuración
      const presentacion = await getPresentacionEspecifica(id)
      
      if (presentacion) {
        //////console.log('Presentación obtenida:', presentacion) // Log para depuración
        // Verificar si ya existe en el carrito
        const yaExiste = presentacionesSeleccionadas.some(p => p.id === presentacion.id)
        
        if (!yaExiste) {
          setPresentacionesSeleccionadas(prev => [...prev, presentacion])
        }
      }
    } catch (error) {
      console.error('Error al agregar presentación:', error)
    } finally {
      setLoadingPresentacion(false)
    }
  }
  
  // Función para eliminar una presentación del carrito
  const eliminarPresentacion = (id: number) => {
    setPresentacionesSeleccionadas(prev => prev.filter(p => p.id !== id))
  }
  
  // Estado para controlar si se está generando el PDF/enviando datos
  const [generando, setGenerando] = useState(false);

  // Función para generar salida de las presentaciones seleccionadas
  const generarSalida = async () => {
    if (generando) return;
    setGenerando(true);
    
    try {
      // Preparar los datos para el endpoint de entregas
      const datosEntrega: EntregaData = {
        entregadoPor: "Usuario Actual", // Esto debería venir del contexto de autenticación
        areaDestino: "Área de destino", // Esto podría ser un campo seleccionable
        responsableArea: "Responsable del área", // Esto podría ser un campo seleccionable
        observaciones: "", // Esto podría venir de un modal con un campo de texto
        detalles: presentacionesSeleccionadas.map(presentacion => ({
          id: presentacion.id,
          lote: presentacion.lote || '', // Agregar campo lote
          cantidadEntregada: presentacion.cantidad || 0,
          observaciones: "",
          nombreProducto: presentacion.item?.descripcion || presentacion.descripcionPresentacion
        }))
      };
      
      // Mostrar en consola los datos que se enviarán
      ////console.log('Datos que se enviarán al endpoint de entregas:', datosEntrega);
      
      // 1. Enviar datos al endpoint
      const resultado = await generateEntrega(datosEntrega);
      
      // 2. Si el envío fue exitoso, generar el PDF y limpiar las presentaciones
      if (resultado.success) {
        // Generar el PDF
        generarPDF();
        
        // Limpiar las presentaciones seleccionadas
        setPresentacionesSeleccionadas([]);
        
        // Mostrar notificación de éxito
        toast.success("Salida generada correctamente", {
          description: "Se ha registrado la salida y generado el PDF",
          duration: 5000
        });
      } else {
        // Mostrar notificación de error
        toast.error("Error al generar la salida", {
          description: "No se pudo registrar la salida",
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error al generar la entrega:', error);
      toast.error("Error al generar la salida", {
        description: "Ocurrió un error inesperado",
        duration: 5000
      });
    } finally {
      setGenerando(false);
    }
  }
  
  // Función para generar el PDF
  const generarPDF = () => {
    // Crear un nuevo documento PDF
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Agregar marca de agua
    const watermarkText = "HOSPITAL NAVAL";
    doc.setTextColor(240, 240, 240); // Gris muy claro
    doc.setFontSize(70);
    doc.setFont("helvetica", "bold");
    
    // Guardar el estado actual del contexto
    const originalState = {
      textColor: doc.getTextColor(),
      fontSize: doc.getFontSize(),
      font: doc.getFont()
    };
    
    // Dibujar marca de agua centrada
    doc.text(watermarkText, pageWidth / 2, pageHeight / 2, {
      angle: -30,
      align: "center"
    });
    
    // Restaurar el estado original
    doc.setTextColor(originalState.textColor);
    doc.setFontSize(originalState.fontSize);
    doc.setFont(originalState.font.fontName);
    
    // Agregar fondo de color suave en la parte superior como encabezado
    doc.setFillColor(240, 245, 255); // Azul muy claro
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    // Agregar línea decorativa
    doc.setDrawColor(0, 51, 102); // Azul naval
    doc.setLineWidth(0.5);
    doc.line(0, 25, pageWidth, 25);
    
    // Calcular el ancho máximo disponible para el título
    const docInfoWidth = 80;
    const titleMaxWidth = pageWidth - docInfoWidth - 30;
    
    // Agregar títulos principales
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 51, 102); // Azul naval
    doc.text("ALMACÉN NAVAL", titleMaxWidth / 2 + 15, 12, { align: "center", maxWidth: titleMaxWidth });
    
    doc.setFontSize(12);
    doc.text("REGISTRO DE SALIDA DE MATERIALES", titleMaxWidth / 2 + 15, 19, { align: "center", maxWidth: titleMaxWidth });
    
    // Agregar número de documento y fecha en la esquina superior derecha
    const fechaActual = new Date();
    const numeroDocumento = `DOC-${fechaActual.getFullYear()}${(fechaActual.getMonth()+1).toString().padStart(2, '0')}${fechaActual.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    doc.setFillColor(0, 51, 102); // Azul naval
    doc.roundedRect(pageWidth - docInfoWidth - 5, 5, docInfoWidth, 15, 2, 2, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255); // Blanco
    doc.text("DOCUMENTO N°", pageWidth - docInfoWidth, 10);
    doc.text(numeroDocumento, pageWidth - docInfoWidth, 14);
    doc.text(`FECHA: ${fechaActual.toLocaleDateString()}`, pageWidth - docInfoWidth, 18);
    
    // Agregar texto explicativo
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60); // Gris oscuro
    const textoExplicativo = "Este documento certifica la salida de materiales del Almacén Naval. "
      + "Los productos listados a continuación han sido retirados del inventario y entregados al solicitante. "
      + "Este documento debe ser firmado tanto por la persona que autoriza la salida como por quien recibe los materiales. "
      + "Una copia de este documento debe ser archivada para mantener un registro adecuado de los movimientos de inventario.";
    
    // Agregar texto explicativo con saltos de línea automáticos
    const splitText = doc.splitTextToSize(textoExplicativo, pageWidth - 30);
    doc.text(splitText, 15, 35);
    
    // Agregar espacio antes de la tabla
    const startTableY = 55;
    
    // Agregar una línea separadora entre el texto y la tabla
    doc.setDrawColor(220, 220, 220); // Gris claro
    doc.setLineWidth(0.3);
    doc.line(15, startTableY - 10, pageWidth - 15, startTableY - 10);
    
    // Agregar un título para la tabla
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 51, 102); // Azul naval
    doc.text("DETALLE DE MATERIALES", pageWidth / 2, startTableY - 5, { align: "center" });
    
    // Agregar un rectángulo sombreado para la tabla
    doc.setFillColor(248, 250, 252); // Gris muy claro
    const tableHeight = Math.max(30, 8 + presentacionesSeleccionadas.length * 8);
    doc.roundedRect(10, startTableY, pageWidth - 20, tableHeight, 2, 2, 'F');
    
    // Crear tabla con los datos
    const tableColumn = ["Código", "Descripción", "Tipo", "Presentación", "Total"];
    const tableRows = presentacionesSeleccionadas.map(presentacion => [
      presentacion.item?.codigo || "",
      presentacion.item?.descripcion || "",
      presentacion.tipoPresentacion || "",
      presentacion.descripcionPresentacion || "",
      (presentacion.cantidad || 0).toString()
    ]);
    
    // Agregar la tabla al PDF
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: startTableY,
      theme: 'grid',
      styles: { 
        fontSize: 10,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [0, 51, 102],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30 },
        3: { cellWidth: 50 },
        4: { cellWidth: 20, halign: 'center' }
      },
    });
    
    // Obtener la posición Y después de la tabla
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Agregar sección para observaciones
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 51, 102); // Azul naval
    doc.text("OBSERVACIONES:", 15, finalY);
    
    // Agregar línea para observaciones
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(15, finalY + 5, pageWidth - 15, finalY + 5);
    doc.line(15, finalY + 15, pageWidth - 15, finalY + 15);
    
    // Agregar sección para firmas
    const firmasY = finalY + 30;
    
    // Agregar líneas para firmas
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    
    // Firma autorización
    doc.line(40, firmasY + 15, 100, firmasY + 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("Firma de Autorización", 70, firmasY + 20, { align: "center" });
    
    // Firma recepción
    doc.line(pageWidth - 100, firmasY + 15, pageWidth - 40, firmasY + 15);
    doc.text("Firma de Recepción", pageWidth - 70, firmasY + 20, { align: "center" });
    
    // Agregar pie de página
    const footerY = pageHeight - 10;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Documento generado el ${fechaActual.toLocaleDateString()} a las ${fechaActual.toLocaleTimeString()}`, pageWidth / 2, footerY, { align: "center" });
    
    // Guardar el PDF con un nombre que incluye la fecha
    const fechaStr = `${fechaActual.getFullYear()}${(fechaActual.getMonth()+1).toString().padStart(2, '0')}${fechaActual.getDate().toString().padStart(2, '0')}`;
    doc.save(`Salida_Materiales_${fechaStr}.pdf`);
  }

  return (
    <div>
      {/* Buscador y filtros */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-naval-600" />
          <Input
            type="text"
            placeholder="Buscar por producto, usuario o área..."
            className="pl-8 border-naval-200 focus-visible:ring-naval-500"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        
        <Select value={tipoSeleccionado} onValueChange={setTipoSeleccionado}>
          <SelectTrigger className="w-[180px] border-naval-200 focus:ring-naval-500">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            {tiposPredefinidos.map(tipo => (
              <SelectItem key={tipo} value={tipo}>
                {tipo === 'todos' ? 'Todos los tipos' : tipo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        

        {/* Botón de carrito eliminado */}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
              <TableHeader className="bg-naval-50">
                <TableRow>
                  <TableHead className="text-naval-700">Código</TableHead>
                  <TableHead className="text-naval-700">Descripción</TableHead>
                  <TableHead className="text-naval-700">Tipo</TableHead>
                  <TableHead className="text-naval-700">Descripción</TableHead>
                  <TableHead className="text-naval-700">Lote</TableHead>
                  <TableHead className="text-naval-700">Cantidad</TableHead>
                  <TableHead className="text-naval-700">Equivalencia</TableHead>
                  <TableHead className="text-naval-700">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presentacionesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-naval-500">
                      {presentaciones.length === 0 ? 'No hay presentaciones disponibles' : 'No se encontraron resultados para la búsqueda'}
                    </TableCell>
                  </TableRow>
                ) : (
                  presentacionesFiltradas.map((presentacion) => (
                    <TableRow key={presentacion.id} className="hover:bg-naval-50">
                      <TableCell className="font-medium">{presentacion.item?.codigo}</TableCell>
                      <TableCell>{presentacion.item?.descripcion}</TableCell>
                      <TableCell>{presentacion.tipoPresentacion}</TableCell>
                      <TableCell>{presentacion.descripcionPresentacion}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-naval-50 text-naval-700 border-naval-200">{presentacion.lote}</Badge>
                      </TableCell>
                      <TableCell>{presentacion.cantidad?.toLocaleString() || '0'}</TableCell>
                      <TableCell>{presentacion.equivalenciaEnBase?.toLocaleString() || '0'}</TableCell>
                      <TableCell>{presentacion.totalEquivalenciaEnBase?.toLocaleString() || '0'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
    </div>
  )
}

export default PresentacionesTable
