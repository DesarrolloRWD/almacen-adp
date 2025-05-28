"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Plus, X, Trash2, Loader2, Minus, FileText } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { api } from "@/lib/api"
import { Presentacion } from "@/lib/api"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Array vacío para resultados de búsqueda
const resultadosBusquedaData: ResultadoBusqueda[] = [];

// Array vacío para la tabla de entregas
const entregasData: Entrega[] = [];



// Interfaces para tipado
interface Producto {
  codigo: string;
  catalogo: string;
  descripcion: string;
  tipoPresentacion?: string;
  descripcionPresentacion?: string;
  equivalenciaEnBase?: number;
  totalEquivalenciaEnBase?: number;
}

interface ResultadoBusqueda {
  id: number;
  producto: Producto;
  lote: string;
  cantidad: number;
  fechaExpiracion: string;
  tipoPresentacion: string;
  descripcionPresentacion: string;
  totalEquivalenciaEnBase: number;
}

interface Usuario {
  nombre: string;
  avatar: string;
  iniciales: string;
  departamento: string;
}

interface Entrega {
  id: number;
  fecha: string;
  tipo: string;
  producto: Producto;
  cantidad: number;
  totalSeleccionado?: number; // Total que el usuario seleccionó
  lote: string;
  area: string;
  usuario: Usuario;
}

// Función para convertir una Presentación de la API a nuestro formato ResultadoBusqueda
const convertirPresentacionAResultado = (presentacion: Presentacion): ResultadoBusqueda => {
  return {
    id: presentacion.id,
    producto: {
      codigo: presentacion.item?.codigo || '',
      catalogo: presentacion.equivalenciaEnBase?.toString() || '0', // Usamos equivalenciaEnBase como catálogo
      descripcion: presentacion.item?.descripcion 
        ? `${presentacion.item.descripcion} - ${presentacion.tipoPresentacion} ${presentacion.descripcionPresentacion}` 
        : `${presentacion.tipoPresentacion} ${presentacion.descripcionPresentacion}`,
    },
    lote: presentacion.lote || '',
    cantidad: presentacion.cantidad || 0,
    fechaExpiracion: new Date().toISOString(), // La API no proporciona fecha de expiración, usamos la fecha actual
    tipoPresentacion: presentacion.tipoPresentacion || '',
    descripcionPresentacion: presentacion.descripcionPresentacion || '',
    totalEquivalenciaEnBase: presentacion.totalEquivalenciaEnBase || 0,
  };
};

export default function HistorialMovimientos() {
  // Estados para búsqueda
  const [codigo, setCodigo] = useState("");
  const [lote, setLote] = useState("");
  
  // Estado para el modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ResultadoBusqueda[]>([]);
  
  // Estado para llevar un registro de cuánto se ha sacado de cada presentación
  const [cantidadesSacadas, setCantidadesSacadas] = useState<{[key: string]: number}>({});
  
  // Estado para las entregas seleccionadas
  const [entregas, setEntregas] = useState<Entrega[]>(entregasData);
  
  // Estado para el siguiente ID de entrega
  const [nextId, setNextId] = useState(entregasData.length > 0 ? Math.max(...entregasData.map(e => e.id)) + 1 : 1);
  
  // Estado para indicar carga
  const [cargando, setCargando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");
  
  // Estado para el modal de observaciones
  const [modalObservacionesAbierto, setModalObservacionesAbierto] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  
  // Función para buscar productos por código y lote
  const buscarProductos = async () => {
    if (!codigo && !lote) {
      setErrorBusqueda("Debe ingresar al menos un código o lote para buscar");
      return;
    }
    
    setCargando(true);
    setErrorBusqueda("");
    setModalAbierto(true); // Abrimos el modal inmediatamente para mostrar el estado de carga
    
    try {
      // Formateamos los datos exactamente como se muestra en Swagger
      const codigoFormateado = codigo.trim();
      const loteFormateado = lote.trim();
      
      console.log('Buscando presentaciones con:', { codigo: codigoFormateado, lote: loteFormateado });
      
      // Llamada a la API para buscar presentaciones por código y lote
      const presentaciones = await api.getPresentacionByCodigoLote(codigoFormateado, loteFormateado);
      
      console.log('Presentaciones encontradas:', presentaciones);
      
      if (!presentaciones || presentaciones.length === 0) {
        setErrorBusqueda("No se encontraron presentaciones con los criterios especificados");
        setResultadosBusqueda([]);
      } else {
        // Convertir las presentaciones al formato que necesitamos
        const resultados = presentaciones.map(convertirPresentacionAResultado);
        
        // Actualizar los resultados con las cantidades ya sacadas
        const resultadosActualizados = resultados.map(res => {
          const presentacionKey = `${res.id}_${res.lote}`;
          const cantidadYaSacada = cantidadesSacadas[presentacionKey] || 0;
          
          // Restar la cantidad ya sacada del total disponible
          return {
            ...res,
            totalEquivalenciaEnBase: Math.max(0, res.totalEquivalenciaEnBase - cantidadYaSacada)
          };
        });
        
        setResultadosBusqueda(resultadosActualizados);
        setErrorBusqueda(""); // Limpiamos cualquier error previo
      }
    } catch (error) {
      console.error("Error al buscar presentaciones:", error);
      setErrorBusqueda("Ocurrió un error al buscar las presentaciones. Inténtelo de nuevo.");
      setResultadosBusqueda([]);
    } finally {
      setCargando(false);
    }
  };
  
  // Función para agregar una entrega desde los resultados de búsqueda
  const agregarEntrega = (resultado: ResultadoBusqueda, cantidadTotal: number = 1) => {
    // Crear una clave única para esta presentación
    const presentacionKey = `${resultado.id}_${resultado.lote}`;
    
    // Obtener cuánto ya se ha sacado de esta presentación
    const cantidadYaSacada = cantidadesSacadas[presentacionKey] || 0;
    
    // Calcular cuánto queda disponible para sacar
    const disponibleRestante = resultado.totalEquivalenciaEnBase;
    
    // Si ya no queda nada disponible, mostrar un mensaje y salir
    if (disponibleRestante <= 0) {
      alert('Ya has sacado todo lo disponible de esta presentación.');
      return;
    }
    
    // Validar que la cantidad total seleccionada no sea mayor que lo disponible restante
    const totalFinal = Math.min(cantidadTotal, disponibleRestante);
    
    // La cantidad es el valor que el usuario seleccionó directamente
    // No necesitamos calcularla a partir del total
    const cantidadFinal = totalFinal;
    
    // Crear una nueva entrega
    const nuevaEntrega: Entrega = {
      id: nextId,
      fecha: new Date().toISOString(),
      tipo: "Salida", // Por defecto es una salida, podría ser configurable
      producto: {
        ...resultado.producto,
        // Incluimos información adicional para mostrar en la tabla
        tipoPresentacion: resultado.tipoPresentacion,
        descripcionPresentacion: resultado.descripcionPresentacion,
        equivalenciaEnBase: parseInt(resultado.producto.catalogo),
        totalEquivalenciaEnBase: resultado.totalEquivalenciaEnBase
      },
      cantidad: resultado.cantidad, // Mostramos la cantidad disponible original
      totalSeleccionado: totalFinal, // Guardamos el total que el usuario seleccionó
      lote: resultado.lote,
      area: "Almacén", // Valor predeterminado, podría ser ajustable
      usuario: {
        nombre: "Usuario actual", // Esto vendría del contexto de autenticación
        avatar: "",
        iniciales: "UA",
        departamento: "Departamento",
      },
    };
    
    // Actualizar el registro de cantidades sacadas
    setCantidadesSacadas({
      ...cantidadesSacadas,
      [presentacionKey]: cantidadYaSacada + totalFinal
    });
    
    // Verificar si ya existe una entrega con el mismo código, tipo y presentación
    const entregaExistente = entregas.find(e => 
      e.producto.codigo === resultado.producto.codigo && 
      e.producto.tipoPresentacion === resultado.tipoPresentacion && 
      e.producto.descripcionPresentacion === resultado.descripcionPresentacion
    );
    
    // Obtener el total original disponible para esta presentación
    const totalOriginalDisponible = resultado.totalEquivalenciaEnBase + cantidadYaSacada;
    
    // Calcular cuánto ya se ha sacado en total (incluyendo lo que ya está en la tabla)
    const totalYaSacadoEnTabla = entregaExistente ? (entregaExistente.totalSeleccionado || 0) : 0;
    
    // Calcular cuánto más podemos sacar (límite)
    const totalDisponibleRestante = totalOriginalDisponible - totalYaSacadoEnTabla;
    
    // Verificar si estamos intentando sacar más de lo disponible
    if (totalFinal > totalDisponibleRestante) {
      alert(`Solo puedes sacar ${totalDisponibleRestante} más de esta presentación. Ya has sacado ${totalYaSacadoEnTabla} de un total de ${totalOriginalDisponible}.`);
      return;
    }
    
    if (entregaExistente) {
      // Si ya existe, actualizamos solo el total seleccionado, manteniendo la cantidad disponible
      const entregasActualizadas = entregas.map(e => {
        if (e.id === entregaExistente.id) {
          return {
            ...e,
            // La cantidad se mantiene igual, representa el disponible
            totalSeleccionado: (e.totalSeleccionado || 0) + totalFinal
          };
        }
        return e;
      });
      setEntregas(entregasActualizadas);
    } else {
      // Si no existe, agregamos la nueva entrega
      setEntregas([...entregas, nuevaEntrega]);
      setNextId(nextId + 1);
    }
    
    // Actualizar los resultados de búsqueda para reflejar las nuevas cantidades disponibles
    const resultadosActualizados = resultadosBusqueda.map(res => {
      if (res.id === resultado.id && res.lote === resultado.lote) {
        // Actualizar el total disponible para este resultado
        return {
          ...res,
          totalEquivalenciaEnBase: Math.max(0, res.totalEquivalenciaEnBase - totalFinal)
        };
      }
      return res;
    });
    
    // Actualizar los resultados con las nuevas cantidades
    setResultadosBusqueda(resultadosActualizados);
    
    // Mantenemos el modal abierto para poder seguir agregando presentaciones
    // No llamamos a setModalAbierto(false);
  };
  
  // Función para eliminar una entrega
  const eliminarEntrega = (id: number) => {
    // Encontrar la entrega que se va a eliminar
    const entregaAEliminar = entregas.find(entrega => entrega.id === id);
    
    if (entregaAEliminar) {
      // Crear una clave única para esta presentación
      const presentacionKey = `${entregaAEliminar.id}_${entregaAEliminar.lote}`;
      
      // Obtener cuánto ya se ha sacado de esta presentación
      const cantidadYaSacada = cantidadesSacadas[presentacionKey] || 0;
      
      // Actualizar el registro de cantidades sacadas, restando lo que se eliminó
      setCantidadesSacadas({
        ...cantidadesSacadas,
        [presentacionKey]: Math.max(0, cantidadYaSacada - (entregaAEliminar.totalSeleccionado || 0))
      });
    }
    
    // Eliminar la entrega
    setEntregas(entregas.filter(entrega => entrega.id !== id));
  };
  
  // Función para limpiar todas las entregas
  const limpiarEntregas = () => {
    setEntregas([]);
    // Reiniciar el registro de cantidades sacadas
    setCantidadesSacadas({});
  };
  
  // Función para mostrar el modal de observaciones
  const mostrarModalObservaciones = () => {
    setModalObservacionesAbierto(true);
  };
  
  // Función para generar el PDF de salida
  const generarPDFSalida = () => {
    // Primero mostrar el modal de observaciones
    mostrarModalObservaciones();
  };
  
  // Función para generar el PDF con las observaciones
  const generarPDFConObservaciones = () => {
    // Cerrar el modal de observaciones
    setModalObservacionesAbierto(false);
    
    // Crear un nuevo documento PDF con orientación horizontal para más espacio
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Agregar una única marca de agua centrada (más sutil)
    const watermarkText = "HOSPITAL NAVAL";
    doc.setTextColor(240, 240, 240); // Gris muy claro, casi invisible
    doc.setFontSize(70); // Tamaño ajustado para el formato horizontal
    doc.setFont("helvetica", "bold");
    
    // Guardar el estado actual del contexto
    const originalState = {
      textColor: doc.getTextColor(),
      fontSize: doc.getFontSize(),
      font: doc.getFont()
    };
    
    // Dibujar una única marca de agua centrada
    doc.text(watermarkText, pageWidth / 2, pageHeight / 2, {
      angle: -30, // Ángulo menos pronunciado
      align: "center"
    });
    
    // Restaurar el estado original
    doc.setTextColor(originalState.textColor);
    doc.setFontSize(originalState.fontSize);
    doc.setFont(originalState.font.fontName);
    
    // Agregar fondo de color suave en la parte superior como encabezado
    doc.setFillColor(240, 245, 255); // Azul muy claro
    doc.rect(0, 0, pageWidth, 25, 'F'); // Altura reducida para el formato horizontal
    
    // Agregar línea decorativa
    doc.setDrawColor(0, 51, 102); // Azul naval
    doc.setLineWidth(0.5);
    doc.line(0, 25, pageWidth, 25);
    
    // Agregar logo o imagen (simulado con un rectángulo azul)
    // doc.setFillColor(0, 51, 102); // Azul naval
    // doc.rect(14, 10, 20, 20, 'F');
    
    // Calcular el ancho máximo disponible para el título (dejando espacio para el número de documento)
    const docInfoWidth = 80; // Ancho del recuadro de info del documento (reducido)
    const titleMaxWidth = pageWidth - docInfoWidth - 30; // Espacio para título
    
    // Agregar títulos principales - ajustados para el formato horizontal
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16); // Tamaño reducido
    doc.setTextColor(0, 51, 102); // Azul naval
    doc.text("ALMACÉN NAVAL", titleMaxWidth / 2 + 15, 12, { align: "center", maxWidth: titleMaxWidth });
    
    doc.setFontSize(12); // Tamaño reducido
    doc.text("REGISTRO DE SALIDA DE MATERIALES", titleMaxWidth / 2 + 15, 19, { align: "center", maxWidth: titleMaxWidth });
    
    // Agregar número de documento y fecha en la esquina superior derecha
    const fechaActual = new Date();
    const numeroDocumento = `DOC-${fechaActual.getFullYear()}${(fechaActual.getMonth()+1).toString().padStart(2, '0')}${fechaActual.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    doc.setFillColor(0, 51, 102); // Azul naval
    doc.roundedRect(pageWidth - docInfoWidth - 5, 5, docInfoWidth, 15, 2, 2, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8); // Tamaño reducido
    doc.setTextColor(255, 255, 255); // Blanco
    doc.text("DOCUMENTO N°", pageWidth - docInfoWidth, 10);
    doc.text(numeroDocumento, pageWidth - docInfoWidth, 14);
    doc.text(`FECHA: ${fechaActual.toLocaleDateString()}`, pageWidth - docInfoWidth, 18);
    
    // Agregar texto explicativo con estilo mejorado - ajustado para formato horizontal
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9); // Tamaño reducido
    doc.setTextColor(60, 60, 60); // Gris oscuro
    const textoExplicativo = "Este documento certifica la salida de materiales del Almacén Naval. "
      + "Los productos listados a continuación han sido retirados del inventario y entregados al solicitante. "
      + "Este documento debe ser firmado tanto por la persona que autoriza la salida como por quien recibe los materiales. "
      + "Una copia de este documento debe ser archivada para mantener un registro adecuado de los movimientos de inventario.";
    
    // Agregar texto explicativo con saltos de línea automáticos
    const splitText = doc.splitTextToSize(textoExplicativo, pageWidth - 30);
    doc.text(splitText, 15, 35);
    
    // Agregar espacio antes de la tabla - con mayor separación del texto
    const startTableY = 55; // Aumentado para mayor separación
    
    // Agregar una línea separadora entre el texto y la tabla
    doc.setDrawColor(220, 220, 220); // Gris claro
    doc.setLineWidth(0.3);
    doc.line(15, startTableY - 10, pageWidth - 15, startTableY - 10);
    
    // Agregar un título para la tabla
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 51, 102); // Azul naval
    doc.text("DETALLE DE MATERIALES", pageWidth / 2, startTableY - 5, { align: "center" });
    
    // Agregar un rectángulo sombreado para la tabla - ajustado al contenido
    doc.setFillColor(248, 250, 252); // Gris muy claro
    // Calcular altura de la tabla según el número de filas, pero con un mínimo
    const tableHeight = Math.max(30, 8 + entregas.length * 8);
    doc.roundedRect(10, startTableY, pageWidth - 20, tableHeight, 2, 2, 'F');
    
    // Crear tabla con los datos (sin columnas de cantidad y equivalencia)
    const tableColumn = ["Código", "Descripción", "Tipo", "Presentación", "Total"];
    const tableRows = entregas.map(entrega => [
      entrega.producto.codigo || "",
      (entrega.producto.descripcion || "").split(' - ')[0],
      entrega.producto.tipoPresentacion || "",
      entrega.producto.descripcionPresentacion || "",
      (entrega.totalSeleccionado || 0).toString()
    ]);
    
    // Agregar la tabla al PDF con estilo mejorado - ajustado para formato horizontal
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: startTableY,
      theme: 'grid',
      styles: { 
        fontSize: 10, // Tamaño ajustado
        cellPadding: 6, // Padding ajustado
        lineColor: [220, 220, 220],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [0, 51, 102], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        halign: 'left'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 30 }, // Código
        1: { cellWidth: 100 }, // Descripción - más ancho en formato horizontal
        2: { halign: 'center', cellWidth: 30 }, // Tipo
        3: { halign: 'center', cellWidth: 50 }, // Presentación
        4: { halign: 'center', cellWidth: 25 }  // Total
      },
      alternateRowStyles: { fillColor: [240, 245, 255] }
    });
    
    // Calcular la posición Y final de la tabla
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    
    // Reducir espacio después de la tabla - ajustado para formato horizontal
    const observacionesY = finalY + 5;
    
    // Calcular altura de la sección de observaciones - reducida para formato horizontal
    const observacionesHeight = observaciones.trim() ? Math.min(30, Math.max(20, observaciones.length / 8)) : 20;
    
    // Agregar sección para observaciones con estilo mejorado
    doc.setFillColor(240, 245, 255); // Azul muy claro
    doc.roundedRect(10, observacionesY, pageWidth - 20, observacionesHeight, 2, 2, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9); // Tamaño reducido
    doc.setTextColor(0, 51, 102); // Azul naval
    doc.text("OBSERVACIONES:", 15, observacionesY + 8);
    
    // Agregar las observaciones si existen
    let observacionesSplit: string[] = [];
    if (observaciones.trim()) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8); // Tamaño reducido
      doc.setTextColor(60, 60, 60); // Gris oscuro
      observacionesSplit = doc.splitTextToSize(observaciones, pageWidth - 40);
      doc.text(observacionesSplit, 15, observacionesY + 15);
    }
    
    // Calcular posición para firmas - ajustado para formato horizontal
    const firmasY = observacionesY + observacionesHeight + 5;
    
    // Ajustar altura de las firmas
    const firmasHeight = 25; // Altura fija más pequeña
    
    // Agregar sección para firmas - ajustado para formato horizontal
    // Usar diseño de dos columnas para aprovechar el espacio horizontal
    doc.setFillColor(248, 250, 252); // Gris muy claro
    doc.roundedRect(pageWidth / 4 - 50, firmasY, 100, firmasHeight, 2, 2, 'F');
    doc.roundedRect(3 * pageWidth / 4 - 50, firmasY, 100, firmasHeight, 2, 2, 'F');
    
    // Dibujar líneas para firmas - ajustadas para formato horizontal
    doc.setDrawColor(0, 51, 102); // Azul naval
    doc.setLineWidth(0.5);
    // Posición de las líneas de firma
    const lineY = firmasY + (firmasHeight * 0.6);
    doc.line(pageWidth / 4 - 40, lineY, pageWidth / 4 + 40, lineY); // Línea para firma 1
    doc.line(3 * pageWidth / 4 - 40, lineY, 3 * pageWidth / 4 + 40, lineY); // Línea para firma 2
    
    // Agregar texto para las firmas - ajustado para formato horizontal
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8); // Tamaño reducido
    doc.setTextColor(0, 51, 102); // Azul naval
    doc.text("AUTORIZADO POR:", pageWidth / 4, firmasY + 7, { align: "center" });
    doc.text("RECIBIDO POR:", 3 * pageWidth / 4, firmasY + 7, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7); // Tamaño reducido
    doc.setTextColor(80, 80, 80); // Gris medio
    doc.text("Nombre y Firma", pageWidth / 4, lineY + 7, { align: "center" });
    doc.text("Nombre y Firma", 3 * pageWidth / 4, lineY + 7, { align: "center" });
    
    // Ajustar posición del pie de página - fijo en la parte inferior
    const footerY = pageHeight - 10;
    
    doc.setDrawColor(0, 51, 102); // Azul naval
    doc.setLineWidth(0.5);
    doc.line(10, footerY - 5, pageWidth - 10, footerY - 5);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7); // Tamaño reducido
    doc.setTextColor(100, 100, 100); // Gris
    doc.text(`Documento generado el ${fechaActual.toLocaleDateString()} a las ${fechaActual.toLocaleTimeString()} | Almacén Naval - Sistema de Gestión de Inventario - Página 1 de 1`, pageWidth / 2, footerY, { align: "center" });
    
    // Guardar el PDF
    doc.save(`Salida_Almacen_${fechaActual.toISOString().split('T')[0]}_${numeroDocumento}.pdf`);
    
    // Mostrar mensaje de éxito
    alert("Se ha generado el PDF de salida correctamente.");
  };

  return (
    <div className="space-y-4">
      {/* Formulario de búsqueda */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codigo">Código</Label>
            <Input
              id="codigo"
              placeholder="Ingrese código del producto"
              className="border-naval-200 focus-visible:ring-naval-500"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lote">Lote</Label>
            <Input
              id="lote"
              placeholder="Ingrese número de lote"
              className="border-naval-200 focus-visible:ring-naval-500"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-end">
          <Button 
            onClick={buscarProductos}
            className="bg-naval-600 hover:bg-naval-700 text-white"
            disabled={cargando}
          >
            {cargando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </>
            )}
          </Button>
        </div>
        {entregas.length > 0 && (
          <div className="flex items-end gap-2">
            <Button 
              variant="outline" 
              onClick={limpiarEntregas}
              className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpiar todo
            </Button>
            <Button 
              onClick={generarPDFSalida}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <FileText className="mr-2 h-4 w-4" />
              Crear Salida
            </Button>
          </div>
        )}
      </div>

      {/* Tabla de entregas */}
      <div className="rounded-md border border-naval-200">
        <Table>
          <TableHeader className="bg-naval-50">
            <TableRow>
              <TableHead className="text-naval-700 w-[120px]">Código</TableHead>
              <TableHead className="text-naval-700">Descripción</TableHead>
              <TableHead className="text-naval-700 w-[100px]">Tipo</TableHead>
              <TableHead className="text-naval-700 w-[120px]">Presentación</TableHead>
              <TableHead className="text-naval-700 w-[80px] text-center">Cantidad</TableHead>
              <TableHead className="text-naval-700 w-[80px] text-center">Equiv.</TableHead>
              <TableHead className="text-naval-700 w-[80px] text-center">Total</TableHead>
              <TableHead className="text-naval-700 w-[50px]">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entregas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No hay entregas registradas. Busque productos por lote o catálogo para agregarlos.
                </TableCell>
              </TableRow>
            ) : (
              entregas.map((entrega) => (
                <TableRow key={entrega.id} className="hover:bg-naval-50">
                  <TableCell>
                    <div className="font-medium text-naval-700">{entrega.producto.codigo}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-naval-700">{entrega.producto.descripcion.split(' - ')[0]}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                      {entrega.producto.tipoPresentacion}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-green-50 text-green-700 border-green-100">
                      {entrega.producto.descripcionPresentacion}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-medium text-naval-700">{entrega.cantidad}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-medium text-green-700">{entrega.producto.catalogo}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-medium text-blue-700">{entrega.totalSeleccionado}</div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => eliminarEntrega(entrega.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Información de paginación */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando <strong>{entregas.length}</strong> entregas
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800"
            disabled
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">Primera página</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800"
            disabled
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Página anterior</span>
          </Button>
          <Button variant="outline" size="sm" className="px-4 border-naval-200 text-naval-700">
            Página 1 de 1
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800"
            disabled
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Página siguiente</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800"
            disabled
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Última página</span>
          </Button>
        </div>
      </div>

      {/* Modal de resultados de búsqueda */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden bg-white rounded-xl shadow-xl">
          {/* Encabezado del modal */}
          <div className="bg-gradient-to-r from-naval-50 to-blue-50 p-5 border-b border-naval-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-naval-800 flex items-center">
                <Search className="h-5 w-5 mr-2 text-naval-600" />
                Resultados de búsqueda
              </DialogTitle>
              <DialogDescription className="text-naval-600 mt-1">
                {errorBusqueda ? (
                  <span className="text-red-500 font-medium">{errorBusqueda}</span>
                ) : (
                  "Seleccione un producto para agregarlo a la tabla de entregas."
                )}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Estado de carga */}
          {cargando ? (
            <div className="flex justify-center items-center h-[300px] bg-white">
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 animate-spin text-naval-600 mb-3" />
                <span className="text-naval-700 font-medium">Cargando resultados...</span>
              </div>
            </div>
          ) : (
            <div className="max-h-[450px] overflow-y-auto p-4">
              {/* Sin resultados */}
              {resultadosBusqueda.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] bg-white">
                  {errorBusqueda ? (
                    <>
                      <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <X className="h-8 w-8 text-red-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-red-700 mb-2">Error en la búsqueda</h3>
                      <p className="text-red-500 text-center max-w-md">{errorBusqueda}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-naval-50 rounded-full flex items-center justify-center mb-4">
                        <Search className="h-8 w-8 text-naval-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-naval-700 mb-2">No se encontraron resultados</h3>
                      <p className="text-naval-500 text-center max-w-md">No hay presentaciones que coincidan con los criterios de búsqueda.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {/* Tarjetas de resultados compactas */}
                  {resultadosBusqueda.map((resultado) => (
                    <div 
                      key={resultado.id} 
                      className="bg-white border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200"
                    >
                      <div className="p-3 flex items-center">
                        {/* ID oculto */}
                        <input type="hidden" value={resultado.id} />
                        
                        {/* Información del producto */}
                        <div className="min-w-0 flex-1 mr-4 ml-1">
                          <h3 className="font-medium text-naval-800 text-sm truncate">{resultado.producto.descripcion.split(' - ')[0]}</h3>
                          <div className="text-xs text-naval-500 flex items-center">
                            <span className="truncate">Código: <span className="font-medium">{resultado.producto.codigo}</span></span>
                            {resultado.lote && (
                              <span className="truncate ml-2">| Lote: <span className="font-medium">{resultado.lote}</span></span>
                            )}
                          </div>
                        </div>
                        
                        {/* Tipo y Color */}
                        <div className="flex space-x-2 mr-4 flex-shrink-0">
                          <div className="flex flex-col items-start">
                            <span className="text-xs text-naval-500 mb-1">Tipo</span>
                            <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-xs">
                              {resultado.tipoPresentacion}
                            </Badge>
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-xs text-naval-500 mb-1">Descripción</span>
                            <Badge className="bg-green-50 text-green-700 border-green-100 text-xs">
                              {resultado.descripcionPresentacion}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Separador vertical */}
                        <div className="h-10 w-px bg-gray-200 mx-3 flex-shrink-0"></div>
                        
                        {/* Cantidades */}
                        <div className="flex items-center space-x-4 mr-3 flex-shrink-0">
                          <div className="flex flex-col items-center w-16">
                            <span className="text-xs text-naval-500 mb-1">Disponible</span>
                            <span className="font-medium text-naval-800 bg-gray-50 px-2 py-0.5 rounded w-full text-center">{resultado.cantidad}</span>
                          </div>
                          
                          <div className="flex flex-col items-center w-16">
                            <span className="text-xs text-naval-500 mb-1">Equiv.</span>
                            <span className="font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded w-full text-center">{resultado.producto.catalogo}</span>
                          </div>
                          
                          <div className="flex flex-col items-center w-16">
                            <span className="text-xs text-naval-500 mb-1">Total</span>
                            <span className="font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded w-full text-center">{resultado.totalEquivalenciaEnBase}</span>
                          </div>
                        </div>
                        
                        {/* Selector de cantidad y botón de acción */}
                        <div className="flex items-center space-x-2 ml-auto">
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-naval-500 mb-1">Cantidad a sacar</span>
                            <div className="flex items-center border border-naval-200 rounded-md overflow-hidden">
                              <button 
                                className={`px-2 py-1 ${resultado.totalEquivalenciaEnBase <= 0 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-naval-50 text-naval-700 hover:bg-naval-100'} border-r border-naval-200`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (resultado.totalEquivalenciaEnBase <= 0) return;
                                  const cantidadElement = document.getElementById(`cantidad-${resultado.id}`) as HTMLInputElement;
                                  if (cantidadElement) {
                                    const currentValue = parseInt(cantidadElement.value) || 0;
                                    if (currentValue > 1) {
                                      cantidadElement.value = (currentValue - 1).toString();
                                    }
                                  }
                                }}
                                disabled={resultado.totalEquivalenciaEnBase <= 0}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <input 
                                id={`cantidad-${resultado.id}`}
                                type="number" 
                                defaultValue="1" 
                                min="1" 
                                max={resultado.totalEquivalenciaEnBase} 
                                className={`w-12 text-center border-none focus:ring-0 focus:outline-none text-sm ${resultado.totalEquivalenciaEnBase <= 0 ? 'bg-gray-100 text-gray-400' : ''}`}
                                disabled={resultado.totalEquivalenciaEnBase <= 0}
                              />
                              <button 
                                className={`px-2 py-1 ${resultado.totalEquivalenciaEnBase <= 0 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                  : 'bg-naval-50 text-naval-700 hover:bg-naval-100'} border-l border-naval-200`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (resultado.totalEquivalenciaEnBase <= 0) return;
                                  const cantidadElement = document.getElementById(`cantidad-${resultado.id}`) as HTMLInputElement;
                                  if (cantidadElement) {
                                    const currentValue = parseInt(cantidadElement.value) || 0;
                                    if (currentValue < resultado.totalEquivalenciaEnBase) {
                                      cantidadElement.value = (currentValue + 1).toString();
                                    }
                                  }
                                }}
                                disabled={resultado.totalEquivalenciaEnBase <= 0}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const cantidadElement = document.getElementById(`cantidad-${resultado.id}`) as HTMLInputElement;
                              const cantidadTotal = cantidadElement ? parseInt(cantidadElement.value) || 1 : 1;
                              agregarEntrega(resultado, cantidadTotal);
                            }}
                            disabled={resultado.totalEquivalenciaEnBase <= 0}
                            className={`h-9 flex-shrink-0 ${resultado.totalEquivalenciaEnBase <= 0 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                              : 'bg-naval-50 text-naval-700 hover:bg-naval-100 hover:text-naval-800 border-naval-200 transition-all duration-200'}`}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            <span className="font-medium">Agregar</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Pie del modal */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setModalAbierto(false)}
              className="border-naval-200 text-naval-700 hover:bg-naval-50"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de observaciones */}
      <Dialog open={modalObservacionesAbierto} onOpenChange={setModalObservacionesAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Observaciones para la salida</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-gray-500 mb-4">
            Agregue observaciones opcionales para el documento de salida.
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <textarea
                id="observaciones"
                placeholder="Ingrese observaciones (opcional)"
                className="w-full h-32 p-2 border border-naval-200 rounded-md focus:outline-none focus:ring-2 focus:ring-naval-500"
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setModalObservacionesAbierto(false)}
                className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800"
              >
                Cancelar
              </Button>
              <Button 
                onClick={generarPDFConObservaciones}
                className="bg-naval-600 hover:bg-naval-700 text-white"
              >
                Generar PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
