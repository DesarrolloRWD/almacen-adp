// Tipos para el sistema de almacén naval

// Producto para remisión
export interface ProductoRemision {
  codigo: string;
  cantidad: string;
  unidad: string;
  descripcion: string;
}

// Estructura completa de una remisión
export interface Remision {
  informacion: {
    ordenRemision: string;
    fechaSalida: string;
    hospital: string;
    tipoSalida: string;
    almacenProveniente: string;
  };
  detalleRemision: ProductoRemision[];
}
