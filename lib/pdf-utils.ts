import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extender el tipo jsPDF para incluir lastAutoTable
declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProductoRemision {
  codigo: string;
  descripcion: string;
  cantidad: string;
  unidad: string;
  confirmacionRecibido?: boolean;
  fechaConfirmacion?: string | null;
  confirmadoPor?: string | null;
  observaciones?: string | null;
}

interface RemisionData {
  informacion: {
    ordenRemision: string;
    fechaSalida: string;
    hospital: string;
    tipoSalida: string;
    almacenProveniente: string;
  };
  detalleRemision: ProductoRemision[];
}

export const generateRemisionPDF = (remision: RemisionData): void => {
  // Crear un nuevo documento PDF
  const doc = new jsPDF();
  
  // Configuración de la página
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  
  // Agregar título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Remisión Naval', pageWidth / 2, margin + 10, { align: 'center' });
  
  // Agregar fecha de generación
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const fechaGeneracion = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
  doc.text(`Generado el: ${fechaGeneracion}`, pageWidth - margin, margin + 5, { align: 'right' });
  
  // Información de la remisión
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Información General', margin, margin + 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Formatear fecha si existe
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy HH:mm", { locale: es });
    } catch (error) {
      return dateString || "N/A";
    }
  };
  
  // Crear tabla de información
  const infoData = [
    ['Número de Remisión:', remision.informacion.ordenRemision || 'N/A'],
    ['Fecha de Salida:', formatDate(remision.informacion.fechaSalida)],
    ['Hospital:', remision.informacion.hospital || 'N/A'],
    ['Tipo de Salida:', remision.informacion.tipoSalida || 'N/A'],
    ['Almacén Proveniente:', remision.informacion.almacenProveniente || 'N/A']
  ];
  
  autoTable(doc, {
    startY: margin + 30,
    head: [],
    body: infoData,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' }
    }
  });
  
  // Título de la tabla de productos
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const productsY = doc.lastAutoTable?.finalY + 15 || 100;
  doc.text('Detalle de Productos', margin, productsY);
  
  // Preparar datos para la tabla de productos
  const tableHead = [
    ['Código', 'Descripción', 'Cantidad', 'Unidad', 'Estado', 'Observaciones']
  ];
  
  const tableBody = remision.detalleRemision.map(producto => [
    producto.codigo || 'N/A',
    producto.descripcion || 'N/A',
    producto.cantidad || '0',
    producto.unidad || 'N/A',
    producto.confirmacionRecibido ? 'Verificado' : 'Pendiente',
    producto.observaciones || ''
  ]);
  
  // Crear tabla de productos
  autoTable(doc, {
    startY: doc.lastAutoTable?.finalY + 20 || 105,
    head: tableHead,
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 25 },
      5: { cellWidth: 40 }
    }
  });
  
  // Agregar pie de página
  const finalY = doc.lastAutoTable?.finalY + 20 || 150;
  
  if (finalY < pageHeight - 30) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('Almacén Naval - Sistema de Gestión de Inventario', pageWidth / 2, finalY, { align: 'center' });
  }
  
  // Guardar el PDF
  doc.save(`Remision_${remision.informacion.ordenRemision || 'Nueva'}.pdf`);
};
