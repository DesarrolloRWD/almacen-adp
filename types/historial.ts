// Interfaz para productos agotados
export interface ProductoAgotado {
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

// Interfaz para productos expirados
export interface ProductoExpirado {
  type: string;
  payload: {
    codigo: string;
    descripcion: string;
    lote: string;
    fechaExpiracion: string;
    division: string;
    linea: string;
    sublinea: string;
    fechaEliminacion: string | null;
    motivo: string | null;
    eliminadoPor: string | null;
  };
  timestamp: number | null;
  source: string;
  correlationId: string;
  routingKey: string;
}
