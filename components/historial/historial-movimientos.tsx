"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

// Importar las divisiones del componente de registro de productos
const divisiones = [
  { value: "COAGULACIÓN", label: "COAGULACIÓN", color: "#40E0D0" },
  { value: "FRACCIONAMIENTO", label: "FRACCIONAMIENTO", color: "#87CEEB" },
  { value: "TOMA DE MUESTRA/SANGRADO", label: "TOMA DE MUESTRA/SANGRADO", color: "#FFD700" },
  { value: "INMUNOHEMATOLOGIA", label: "INMUNOHEMATOLOGIA", color: "#D3D3D3" },
  { value: "CONFIRMATORIAS", label: "CONFIRMATORIAS", color: "#FF9999" },
  // { value: "NAT", label: "NAT", color: "#FFA07A" },
  { value: "NAT PANTHER", label: "NAT PANTHER", color: "#A0522D" },
  { value: "HEMATOLOGÍA", label: "HEMATOLOGÍA", color: "#90EE90" },
  { value: "SEROLOGÍA", label: "SEROLOGÍA", color: "#6495ED" },
  { value: "BIOLOGIA MOLECULAR", label: "BIOLOGIA MOLECULAR", color: "#708090" },
  { value: "CITOMETRÍA", label: "CITOMETRÍA", color: "#DDA0DD" },
  { value: "LAVADO DE MATERIAL ", label: "LAVADO DE MATERIAL ", color: "#FF0000" },
  { value: "TERAPIA CELULAR", label: "TERAPIA CELULAR", color: "#212f3d" }
  
]
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Plus, X, Trash2, Loader2, Minus, FileText, PackageCheck, MoreVertical, MessageSquare, History, Filter } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { api } from "@/lib/api"
import { Presentacion, getAllUsers, ProductoAgotado } from "@/lib/api"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { generateEntrega, EntregaData } from "@/lib/api"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  comentario?: string; // Comentario específico para esta presentación
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
    // Aseguramos que el lote se capture correctamente, sin usar el operador || que puede causar problemas
    lote: presentacion.lote,
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
  
  // Estado para controlar el tipo de búsqueda activa
  const [tipoBusqueda, setTipoBusqueda] = useState<'codigoLote' | 'general'>('codigoLote');
  
  // Estado para la lista de todas las presentaciones
  const [todasPresentaciones, setTodasPresentaciones] = useState<Presentacion[]>([]);
  const [cargandoPresentaciones, setCargandoPresentaciones] = useState(false);
  
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
  
  // Estados para el historial de productos agotados
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
  const [productosAgotados, setProductosAgotados] = useState<ProductoAgotado[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState("");
  const [productoSeleccionadoHistorial, setProductoSeleccionadoHistorial] = useState<ProductoAgotado | null>(null);
  const [modalDetalleHistorialAbierto, setModalDetalleHistorialAbierto] = useState(false);
  
  // Estados para filtros del historial
  const [filtroUnidad, setFiltroUnidad] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroDivision, setFiltroDivision] = useState("");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
  const [filtroFechaFin, setFiltroFechaFin] = useState("");
  const [productosFiltrados, setProductosFiltrados] = useState<ProductoAgotado[]>([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Estados para listas de opciones de filtros
  const [unidadesUnicas, setUnidadesUnicas] = useState<string[]>([]);
  const [marcasUnicas, setMarcasUnicas] = useState<string[]>([]);
  const [divisionesUnicas, setDivisionesUnicas] = useState<string[]>([]);
  
  // El estado mostrarFiltros ya está definido arriba
  
  // Estado para el modal de observaciones
  const [modalObservacionesAbierto, setModalObservacionesAbierto] = useState(false);
  const [observaciones, setObservaciones] = useState("");
  const [entregadoPor, setEntregadoPor] = useState("");
  const [areaDestino, setAreaDestino] = useState("");
  const [responsableArea, setResponsableArea] = useState("");
  
  // Lista de responsables de área predefinidos
  const responsablesAreaOptions = [
    "TTE.FGTA.SSN.L.QUIM. SANDRA MURRIETA",
    "TTE.FGTA.SSN.L.QUIM. FERNANDO EDSON COMPAGNY MACIAS",
    "TTE.FGTA.SSN.L.QUIM. YARETH GALVAN GOIZ",
    "TTE.FGTA.SSN.L.QUIM. KARLA ANGELITO DE JESUS",
    "TTE.FGTA.SSN.L.QUIM. FREINET MARIN MONTES",
    "TTE.FGTA.SSN.L.QUIM. ELYEL MAYO HERNANDEZ",
    "TTE.CORB.SSN.L.QUIM. GABRIELA DIAZ BAHENA",
    "TTE.CORB.SSN.L.QUIM. MARTHA ISELA MENDOZA RODRIGUEZ",
    "TTE.CORB.SSN.L.QUIM. ELIZABETH DIAZ PADILLA",
    "TTE.CORB.SSN.L.QUIM. BRENDA ITZEL PATIÑO ARMENTA",
    "TTE.CORB.SSN.L.QUIM. ATZIN ITZEL MORA HERNANDEZ",
    "TTE.CORB.SSN.L.QUIM. ERICK RAYMUNDO CRUZ",
    "TTE.CORB.SSN.L.QUIM. VALERIA CRUZ PEREZ",
    "TTE.CORB.SSN.L.QUIM. NALLELY MICHELLE MARIN ZURITA",
    "TTE.CORB.SSN.L.QUIM. CLAUDIA MONDRAGON ALBARRAN",
    "1/ER MTRE. SSN. TEC.LAB JUAN CARLOS SANCHEZ PANIAGUA"
  ];
  
  // Estado para el modal de comentarios específicos
  const [modalComentarioAbierto, setModalComentarioAbierto] = useState(false);
  const [comentarioActual, setComentarioActual] = useState("");
  const [entregaSeleccionadaId, setEntregaSeleccionadaId] = useState<number | null>(null);
  
  // Estado para el nombre de usuario
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Obtener el nombre de usuario al cargar el componente
  useEffect(() => {
    const obtenerUsuarioActual = async () => {
      setIsLoadingUsers(true);
      try {
        // Obtener la lista de usuarios
        const usuarios = await getAllUsers();
        
        // Buscar el usuario actual
        let usuarioActual = null;
        
        // Intentar obtener el usuario desde localStorage
        const token = localStorage.getItem('token');
        
        if (token) {
          try {
            // Decodificar el token JWT para obtener el nombre de usuario
            const base64Url = token.split('.')[1];
            if (base64Url) {
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
              const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
              }).join(''));
              
              const payload = JSON.parse(jsonPayload);
              const username = payload.sub || payload.usuario;
              
              if (username) {
                usuarioActual = usuarios.find(u => u.usuario === username);
              }
            }
          } catch (e) {
            // Error al decodificar el token JWT
          }
        }
        
        // Si encontramos el usuario, usar solo su nombre de usuario (usuario)
        if (usuarioActual) {
          setNombreUsuario(usuarioActual.usuario);
          setEntregadoPor(usuarioActual.usuario); // Establecer automáticamente el valor
        } else if (usuarios.length > 0) {
          // Si no encontramos el usuario, usar el primer usuario de la lista como fallback
          const primerUsuario = usuarios[0];
          setNombreUsuario(primerUsuario.usuario);
          setEntregadoPor(primerUsuario.usuario); // Establecer automáticamente el valor
        }
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    obtenerUsuarioActual();
  }, []);
  
  // Función para buscar productos por código y lote
  const buscarProductosPorCodigoLote = async () => {
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
      
  
      
      // Llamada a la API para buscar presentaciones por código y lote
      // Aseguramos que ambos parámetros se pasen correctamente
      const presentaciones = await api.getPresentacionByCodigoLote(codigoFormateado, loteFormateado);
      
      
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
  
  // Función para buscar todas las presentaciones
  const buscarTodasPresentaciones = async () => {
    setCargando(true);
    setErrorBusqueda("");
    setModalAbierto(true); // Abrimos el modal inmediatamente para mostrar el estado de carga
    
    try {
      // Llamada a la API para obtener todas las presentaciones
      const presentaciones = await api.getPresentaciones();
      
      if (!presentaciones || presentaciones.length === 0) {
        setErrorBusqueda("No se encontraron presentaciones disponibles");
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
  
  // Función que decide qué tipo de búsqueda realizar
  const buscarProductos = () => {
    if (tipoBusqueda === 'codigoLote') {
      buscarProductosPorCodigoLote();
    } else {
      buscarTodasPresentaciones();
    }
  };
  
  // Función para obtener el historial de productos agotados
  const obtenerHistorialProductosAgotados = async () => {
    setCargandoHistorial(true);
    setErrorHistorial("");
    setModalHistorialAbierto(true); // Abrimos el modal inmediatamente para mostrar el estado de carga
    
    try {
      // Llamada a la API para obtener el historial de productos agotados
      const productos = await api.getHistorialProductosAgotados();
      
      if (!productos || productos.length === 0) {
        setErrorHistorial("No se encontraron productos agotados en el historial");
        setProductosAgotados([]);
        setProductosFiltrados([]);
      } else {
        setProductosAgotados(productos);
        setProductosFiltrados(productos);
        setErrorHistorial(""); // Limpiamos cualquier error previo
        
        // Extraer listas únicas para los filtros
        const unidades = [...new Set(productos.map((p: ProductoAgotado) => p.unidadBase))].filter(Boolean) as string[];
        const marcas = [...new Set(productos.map((p: ProductoAgotado) => p.marca))].filter(Boolean) as string[];
        const divisiones = [...new Set(productos.map((p: ProductoAgotado) => p.division))].filter(Boolean) as string[];
        
        setUnidadesUnicas(unidades);
        setMarcasUnicas(marcas);
        setDivisionesUnicas(divisiones);
        
        // Limpiar filtros
        setFiltroUnidad("");
        setFiltroMarca("");
        setFiltroDivision("");
        setFiltroFechaInicio("");
        setFiltroFechaFin("");
      }
    } catch (error) {
      console.error("Error al obtener historial de productos agotados:", error);
      setErrorHistorial("Ocurrió un error al obtener el historial de productos agotados. Inténtelo de nuevo.");
      setProductosAgotados([]);
      setProductosFiltrados([]);
    } finally {
      setCargandoHistorial(false);
    }
  };
  
  // Función para aplicar filtros al historial de productos
  const aplicarFiltros = () => {
   
    
    let resultadosFiltrados = [...productosAgotados];
    
    // Filtrar por unidad
    if (filtroUnidad) {
      resultadosFiltrados = resultadosFiltrados.filter((p: ProductoAgotado) => 
        p.unidadBase && p.unidadBase.toLowerCase() === filtroUnidad.toLowerCase()
      );
    }
    
    // Filtrar por marca
    if (filtroMarca) {
      resultadosFiltrados = resultadosFiltrados.filter((p: ProductoAgotado) => 
        p.marca && p.marca.toLowerCase() === filtroMarca.toLowerCase()
      );
    }
    
    // Filtrar por división
    if (filtroDivision) {
      resultadosFiltrados = resultadosFiltrados.filter((p: ProductoAgotado) => 
        p.division && p.division.toLowerCase() === filtroDivision.toLowerCase()
      );
    }
    
    // Filtrar por fecha
    if (filtroFechaInicio || filtroFechaFin) {
      
      // Si ambas fechas están definidas y son iguales, filtramos por ese día específico
      if (filtroFechaInicio && filtroFechaFin && filtroFechaInicio === filtroFechaFin) {
        
        // Convertir la fecha string a objeto Date
        const fechaStr = filtroFechaInicio; // formato "YYYY-MM-DD"
        
        // Crear fechas para el inicio y fin del día
        const [year, month, day] = fechaStr.split('-').map(num => parseInt(num));
        const inicioDia = new Date(year, month - 1, day, 0, 0, 0, 0);
        const finDia = new Date(year, month - 1, day, 23, 59, 59, 999);
        

        
        resultadosFiltrados = resultadosFiltrados.filter((p: ProductoAgotado) => {
          const fechaProducto = new Date(p.fechaEliminacion);
          const resultado = fechaProducto >= inicioDia && fechaProducto <= finDia;

          return resultado;
        });
      } else {
        // Filtrado normal para rangos de fechas diferentes
        if (filtroFechaInicio) {
          const [year, month, day] = filtroFechaInicio.split('-').map(num => parseInt(num));
          const fechaInicio = new Date(year, month - 1, day, 0, 0, 0, 0);
          
          
          resultadosFiltrados = resultadosFiltrados.filter((p: ProductoAgotado) => {
            const fechaProducto = new Date(p.fechaEliminacion);
            return fechaProducto >= fechaInicio;
          });
        }
        
        if (filtroFechaFin) {
          const [year, month, day] = filtroFechaFin.split('-').map(num => parseInt(num));
          const fechaFin = new Date(year, month - 1, day, 23, 59, 59, 999);
          
          
          resultadosFiltrados = resultadosFiltrados.filter((p: ProductoAgotado) => {
            const fechaProducto = new Date(p.fechaEliminacion);
            return fechaProducto <= fechaFin;
          });
        }
      }
    }
    
    if (resultadosFiltrados.length > 0) {
    }
    
    setProductosFiltrados(resultadosFiltrados);
  };
  
  // Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltroUnidad("");
    setFiltroMarca("");
    setFiltroDivision("");
    setFiltroFechaInicio("");
    setFiltroFechaFin("");
    setProductosFiltrados(productosAgotados);
  };
  
  // Función para ver detalle del producto
  const verDetalleProducto = (producto: ProductoAgotado) => {
    setProductoSeleccionadoHistorial(producto);
    setModalDetalleHistorialAbierto(true);
  };
  
  // Definimos los colores de las divisiones (igual que en productos-table.tsx)
  const divisionColors: {[key: string]: string} = {
    "COAGULACIÓN": "#40E0D0",
    "FRACCIONAMIENTO": "#87CEEB",
    "TOMA DE MUESTRA/SANGRADO": "#FFD700",
    "INMUNOHEMATOLOGIA": "#D3D3D3",
    "CONFIRMATORIAS": "#FF9999",
    // "NAT": "#FFA07A",
    "NAT PANTHER": "#A0522D",
    "HEMATOLOGÍA": "#90EE90",
    "SEROLOGÍA": "#6495ED",
    "BIOLOGIA MOLECULAR": "#708090",
    "CITOMETRÍA": "#DDA0DD",
    "LAVADO DE MATERIAL ": "#FF0000",
    "TERAPIA CELULAR": "#212f3d"
  };
  
  // Función para obtener el color hexadecimal de la división
  const getColorHexForDivision = (division: string): string => {
    return divisionColors[division] || "#D3D3D3"; // Color gris por defecto
  };
  
  // Función para obtener el color de la división basado en los colores definidos en productos-table.tsx
  const getColorDivision = (division: string) => {
    // Mapa de colores hexadecimales a clases de Tailwind
    const colorMap: {[key: string]: {bg: string, text: string, border: string}} = {
      // COAGULACIÓN - Turquesa
      "#40E0D0": {bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-100"},
      // FRACCIONAMIENTO - Azul claro
      "#87CEEB": {bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100"},
      // TOMA DE MUESTRA/SANGRADO - Amarillo
      "#FFD700": {bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100"},
      // INMUNOHEMATOLOGIA - Gris claro
      "#D3D3D3": {bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-100"},
      // CONFIRMATORIAS - Rosa claro
      "#FF9999": {bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100"},
      // NAT - Salmón
      // "#FFA07A": {bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100"},
      // NAT PANTHER - Marrón
      "#A0522D": {bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200"},
      // HEMATOLOGÍA - Verde claro
      "#90EE90": {bg: "bg-green-50", text: "text-green-700", border: "border-green-100"},
      // SEROLOGÍA - Azul medio
      "#6495ED": {bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100"},
      // BIOLOGIA MOLECULAR - Gris oscuro
      "#708090": {bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200"},
      // CITOMETRÍA - Lavanda
      "#DDA0DD": {bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100"},
      // LAVADO DE MATERIAL - Rojo
      "#FF0000": {bg: "bg-red-50", text: "text-red-700", border: "border-red-100"},
      // TERAPIA CELULAR - Azul oscuro
      "#212f3d": {bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100"}
    };
    
    // Obtener el color hexadecimal para la división
    const hexColor = getColorHexForDivision(division);
    
    // Si encontramos un color para la división, devolver las clases de Tailwind correspondientes
    if (colorMap[hexColor]) {
      return colorMap[hexColor];
    }
    
    // Color por defecto si no se encuentra
    return {bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-100"};
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
      id: resultado.id, // Usar el ID original de la presentación en lugar de nextId
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
    
    // Verificar si ya existe una entrega con el mismo código, tipo, presentación Y LOTE
    // Es crucial incluir el lote en esta comparación para evitar combinar productos con diferentes lotes
    const entregaExistente = entregas.find(e => 
      e.producto.codigo === resultado.producto.codigo && 
      e.producto.tipoPresentacion === resultado.tipoPresentacion && 
      e.producto.descripcionPresentacion === resultado.descripcionPresentacion &&
      e.lote === resultado.lote // Agregamos la comparación por lote
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
    
    // Si estamos en modo de búsqueda por código y lote, limpiamos los campos después de agregar
    if (tipoBusqueda === 'codigoLote') {
      setCodigo("");
      setLote("");
    }
    
    // Mantenemos el modal abierto para poder seguir agregando presentaciones
    // No llamamos a setModalAbierto(false);
  };
  
  // Función para abrir el modal de comentarios
  const abrirModalComentario = (id: number) => {
    const entrega = entregas.find(e => e.id === id);
    if (entrega) {
      setEntregaSeleccionadaId(id);
      setComentarioActual(entrega.comentario || "");
      setModalComentarioAbierto(true);
    }
  };
  
  // Función para guardar el comentario de una entrega específica
  const guardarComentario = () => {
    if (entregaSeleccionadaId === null) return;
    
    const entregasActualizadas = entregas.map(entrega => {
      if (entrega.id === entregaSeleccionadaId) {
        return {
          ...entrega,
          comentario: comentarioActual
        };
      }
      return entrega;
    });
    
    setEntregas(entregasActualizadas);
    setModalComentarioAbierto(false);
    setEntregaSeleccionadaId(null);
    
    // Mostrar notificación de éxito
    toast.success("Comentario guardado", {
      description: "El comentario se ha guardado correctamente",
      duration: 3000
    });
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
  
  // Estado para controlar si se está generando la salida
  const [generandoSalida, setGenerandoSalida] = useState(false);
  // Estado para controlar la visibilidad del modal de carga
  const [modalCargaAbierto, setModalCargaAbierto] = useState(false);

  // Función para generar el PDF con las observaciones
  const generarPDFConObservaciones = async () => {
    // Validar que se hayan ingresado los datos requeridos
    if (!entregadoPor.trim()) {
      toast.error("Error", {
        description: "Debe ingresar quién entrega los productos",
        duration: 3000
      });
      return;
    }
    
    if (!areaDestino.trim()) {
      toast.error("Error", {
        description: "Debe ingresar el área de destino",
        duration: 3000
      });
      return;
    }
    
    if (!responsableArea) {
      toast.error("Error", {
        description: "Debe seleccionar el responsable del área",
        duration: 3000
      });
      return;
    }
    
    setGenerandoSalida(true);
    // Mostrar el modal de carga
    setModalCargaAbierto(true);
    
    try {
      // Cerrar el modal de observaciones
      setModalObservacionesAbierto(false);
      
      // Preparar los datos para el endpoint de entregas
      // IMPORTANTE: Los comentarios específicos de cada presentación (entrega.comentario) 
      // no se envían al microservicio, solo se usan para el PDF
      
   
      
      const datosEntrega: EntregaData = {
        entregadoPor: entregadoPor,
        areaDestino: areaDestino,
        responsableArea: responsableArea,
        observaciones: observaciones || '', // Observaciones generales para toda la entrega
        detalles: entregas.map(entrega => {
         
          
          // Si el lote es undefined, imprimir un mensaje de advertencia
          if (entrega.lote === undefined || entrega.lote === null) {
            console.warn('ADVERTENCIA: Lote indefinido o nulo para la entrega:', entrega.id);
          }
          
          return {
            id: entrega.id,
            // Aseguramos que el lote nunca sea undefined o null
            lote: typeof entrega.lote === 'string' ? entrega.lote : '',
            cantidadEntregada: entrega.totalSeleccionado || entrega.cantidad || 0,
            observaciones: observaciones || '',
            nombreProducto: entrega.producto?.descripcion || ''
          };
        })
      };

      // Enviar datos al endpoint
      const resultado = await generateEntrega(datosEntrega);
      
      // Si el envío fue exitoso, generar el PDF y limpiar las entregas
      if (resultado.success) {
        // Generar el PDF
        generarPDF();
        
        // Limpiar las entregas
        setEntregas([]);
        
        // Ya no mostramos notificación toast, solo el modal de carga
      } else {
        // Mostrar error en consola
        console.error('Error al generar la salida');
      }
    } catch (error) {
      console.error('Error al generar la entrega:', error);
      // Ya no mostramos notificación toast de error
    } finally {
      setGenerandoSalida(false);
      // Ocultar el modal de carga
      setModalCargaAbierto(false);
    }
  };
  
  // Función para generar el PDF
  const generarPDF = () => {
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
    
    // Crear tabla con los datos sin columna de comentarios
    const tableColumn = ["Código", "Descripción", "Tipo", "Presentación", "Total"];
    const tableRows = entregas.map(entrega => {
      // Preparar la descripción con el comentario debajo si existe
      const descripcionBase = (entrega.producto.descripcion || "").split(' - ')[0];
      const descripcionConComentario = entrega.comentario 
        ? `${descripcionBase}\n\nObservaciones: ${entrega.comentario}` 
        : descripcionBase;
      
      return [
        entrega.producto.codigo || "",
        descripcionConComentario,
        entrega.producto.tipoPresentacion || "",
        entrega.producto.descripcionPresentacion || "",
        (entrega.totalSeleccionado || 0).toString()
      ];
    });
    
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
      alternateRowStyles: { fillColor: [240, 245, 255] },
      // Configuración para dar formato especial a los comentarios
      didParseCell: function(data) {
        // Si estamos en la columna de descripción y hay un salto de línea (comentario)
        if (data.column.index === 1 && data.cell.text.toString().includes('\n')) {
          // Dividir el texto en descripción y comentario
          const textoCompleto = data.cell.text.toString();
          const partes = textoCompleto.split('\n');
          
          // Crear un array con la descripción y el comentario con estilos diferentes
          data.cell.text = [
            partes[0], // Descripción normal
            partes[1] // Comentario
          ];
          
          // Aplicar estilos al comentario
          if (data.cell.styles) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 6; // Letra pequeña (6pt)
            data.cell.styles.textColor = [0, 0, 0]; // Color negro para el comentario
          }
        }
      }
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
    

    
    // Limpiar los campos del formulario después de generar la salida
    setEntregas([]);
    setCantidadesSacadas({});
    setObservaciones("");
    setAreaDestino("");
    setResponsableArea("");
    setModalObservacionesAbierto(false);
  };

  return (
    <div className="space-y-4">

      
      {/* Formulario de búsqueda - Diseño mejorado */}
      <div className="bg-white rounded-xl border border-naval-100 shadow-sm overflow-hidden">
        
        <div className="p-4">
          <div className="flex items-center mb-3 bg-gray-50 p-2 rounded-md border border-gray-200">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Ingrese código y/o lote para una búsqueda específica, o use "Búsqueda General" para ver todas las presentaciones disponibles.</span> 
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-end mb-4">
            <div className="w-full sm:w-auto">
              <div className="flex items-center mb-1">
                <FileText className="h-4 w-4 mr-1 text-naval-500" />
                <Label htmlFor="codigo" className="text-naval-700 text-sm font-medium">
                  Código
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="codigo"
                  placeholder="Ej. PR001"
                  className="border-naval-200 focus-visible:ring-naval-500 pl-8 h-9 text-sm"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                  <FileText className="h-3 w-3 text-naval-400" />
                </div>
              </div>
            </div>
            
            <div className="w-full sm:w-auto">
              <div className="flex items-center mb-1">
                <PackageCheck className="h-4 w-4 mr-1 text-naval-500" />
                <Label htmlFor="lote" className="text-naval-700 text-sm font-medium">
                  Lote
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="lote"
                  placeholder="Ej. LOT20230527"
                  className="border-naval-200 focus-visible:ring-naval-500 pl-8 h-9 text-sm"
                  value={lote}
                  onChange={(e) => setLote(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                  <PackageCheck className="h-3 w-3 text-naval-400" />
                </div>
              </div>
            </div>
            
            <Button 
              onClick={buscarProductosPorCodigoLote}
              className="bg-naval-600 hover:bg-naval-700 text-white shadow-sm h-9"
              disabled={cargando}
              size="sm"
            >
              {cargando ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  <span className="text-sm">Buscando...</span>
                </>
              ) : (
                <>
                  <FileText className="mr-1 h-3 w-3" />
                  <span className="text-sm">Buscar</span>
                </>
              )}
            </Button>
            
            <div className="ml-auto flex gap-2">
              <Button 
                onClick={buscarTodasPresentaciones}
                className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                disabled={cargando}
                size="sm"
              >
                <Search className="mr-2 h-4 w-4" />
                Búsqueda General
              </Button>
              

            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-between items-center border-t border-naval-100 pt-4">
            
            {entregas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  onClick={limpiarEntregas}
                  className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800"
                  size="sm"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpiar Lista
                </Button>
                <Button 
                  onClick={generarPDFSalida}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                  size="sm"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Generar Salida
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de entregas */}
      <div className="rounded-md border border-naval-200">
        <Table className="w-full">
          <TableHeader className="bg-naval-50">
            <TableRow>
              <TableHead className="text-naval-700 w-[90px] py-2">Código</TableHead>
              <TableHead className="text-naval-700 py-2">Descripción</TableHead>
              <TableHead className="text-naval-700 w-[80px] py-2">Tipo</TableHead>
              <TableHead className="text-naval-700 w-[100px] py-2">Presentación</TableHead>
              <TableHead className="text-naval-700 w-[70px] text-center py-2">Cantidad</TableHead>
              <TableHead className="text-naval-700 w-[60px] text-center py-2">Equiv.</TableHead>
              <TableHead className="text-naval-700 w-[60px] text-center py-2">Total</TableHead>
              <TableHead className="text-naval-700 w-[50px] py-2">Acción</TableHead>
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
                  <TableCell className="py-2">
                    <div className="font-medium text-naval-700">{entrega.producto.codigo}</div>
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="font-medium text-naval-700">{entrega.producto.descripcion.split(' - ')[0]}</div>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge className="bg-blue-50 text-blue-700 border-blue-100 text-xs py-1">
                      {entrega.producto.tipoPresentacion}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2">
                    <Badge className="bg-green-50 text-green-700 border-green-100 text-xs py-1">
                      {entrega.producto.descripcionPresentacion}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <div className="font-medium text-naval-700">{entrega.cantidad}</div>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <div className="font-medium text-green-700">{entrega.producto.catalogo}</div>
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <div className="font-medium text-blue-700">{entrega.totalSeleccionado}</div>
                  </TableCell>
                  <TableCell className="py-2 relative">
                    <div className="flex flex-col items-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-naval-500 hover:text-naval-700 hover:bg-naval-50 h-7 w-7 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Opciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem
                            onClick={() => abrirModalComentario(entrega.id)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {entrega.comentario ? "Editar comentario" : "Agregar comentario"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => eliminarEntrega(entrega.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      {entrega.comentario && (
                        <div className="mt-1">
                          <Badge 
                            variant="outline" 
                            className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0 px-1 whitespace-nowrap"
                          >
                            <MessageSquare className="h-2.5 w-2.5 mr-0.5" />
                            Con comentario
                          </Badge>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Resumen de entregas */}
      <div className="mt-3 bg-naval-50 rounded-lg p-3 border border-naval-100 shadow-sm">
        <div className="flex items-center">
          <FileText className="h-4 w-4 mr-2 text-naval-600" />
          <div className="text-sm font-medium text-naval-700 flex items-center">
            <span>Resumen:</span>
            <div className="flex items-center ml-3">
              <strong className="text-lg text-naval-800 mr-2">{entregas.length}</strong>
              <span>{entregas.length === 1 ? 'entrega registrada' : 'entregas registradas'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de resultados de búsqueda */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-white rounded-xl shadow-xl" aria-describedby="busqueda-description">
          {/* Encabezado del modal */}
          <div className="bg-gradient-to-r from-naval-50 to-blue-50 p-5 border-b border-naval-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-naval-800 flex items-center">
                <Search className="h-5 w-5 mr-2 text-naval-600" />
                Resultados de búsqueda
              </DialogTitle>
              <DialogDescription id="busqueda-description" className="text-naval-600 mt-1">
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
                <div className="grid grid-cols-1 gap-4">
                  {/* Tabla de resultados */}
                  <table className="w-full border-collapse">
                    <thead className="bg-naval-50">
                      <tr>
                        <th className="py-2 px-3 text-left text-naval-700 font-medium text-sm">Producto</th>
                        <th className="py-2 px-3 text-center text-naval-700 font-medium text-sm">Tipo</th>
                        <th className="py-2 px-3 text-center text-naval-700 font-medium text-sm">Descripción</th>
                        <th className="py-2 px-3 text-center text-naval-700 font-medium text-sm">Disponible</th>
                        <th className="py-2 px-3 text-center text-naval-700 font-medium text-sm">Equiv.</th>
                        <th className="py-2 px-3 text-center text-naval-700 font-medium text-sm">Total</th>
                        <th className="py-2 px-3 text-center text-naval-700 font-medium text-sm">Cantidad a sacar</th>
                        <th className="py-2 px-3 text-center text-naval-700 font-medium text-sm">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultadosBusqueda.map((resultado) => (
                        <tr key={resultado.id} className="border-b border-naval-100 hover:bg-naval-50/50">
                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="font-medium text-naval-800">{resultado.producto.descripcion.split(' - ')[0]}</span>
                              <div className="flex items-center text-xs text-naval-500 mt-1">
                                <span>Código: <span className="font-medium">{resultado.producto.codigo}</span></span>
                                {resultado.lote && (
                                  <span className="ml-2">| Lote: <span className="font-medium">{resultado.lote}</span></span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge className="bg-blue-50 text-blue-700 border-blue-100">
                              {resultado.tipoPresentacion}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Badge className="bg-green-50 text-green-700 border-green-100">
                              {resultado.descripcionPresentacion}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 text-center font-medium text-naval-800">
                            {resultado.cantidad}
                          </td>
                          <td className="py-3 px-3 text-center font-medium text-green-700">
                            {resultado.producto.catalogo}
                          </td>
                          <td className="py-3 px-3 text-center font-medium text-blue-700">
                            {resultado.totalEquivalenciaEnBase}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center">
                              <div className="flex border border-naval-200 rounded-md overflow-hidden">
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
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const cantidadElement = document.getElementById(`cantidad-${resultado.id}`) as HTMLInputElement;
                                const cantidadTotal = cantidadElement ? parseInt(cantidadElement.value) || 1 : 1;
                                agregarEntrega(resultado, cantidadTotal);
                              }}
                              disabled={resultado.totalEquivalenciaEnBase <= 0}
                              className={`${resultado.totalEquivalenciaEnBase <= 0 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-naval-50 text-naval-700 hover:bg-naval-100 hover:text-naval-800 border-naval-200'}`}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Agregar
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
      
      {/* Modal de historial de productos agotados */}
      <Dialog open={modalHistorialAbierto} onOpenChange={setModalHistorialAbierto}>
        <DialogContent 
          className="w-[95vw] max-h-[90vh] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[900px] p-0 overflow-hidden bg-white rounded-lg shadow-md" 
          aria-describedby="historial-description"
        >
          {/* Encabezado del modal */}
          <div className="bg-gradient-to-r from-blue-50 to-naval-50 p-4 border-b border-naval-100">
            <DialogHeader className="pb-0">
              <div>
                <DialogTitle className="text-lg font-bold text-naval-800 flex items-center">
                  <History className="h-4 w-4 mr-2 text-naval-600" />
                  Historial de Productos Agotados
                </DialogTitle>
                <DialogDescription id="historial-description" className="text-naval-600 mt-1 text-xs">
                  {errorHistorial ? (
                    <span className="text-red-500 font-medium">{errorHistorial}</span>
                  ) : (
                    "Listado de productos que han sido agotados o eliminados del inventario."
                  )}
                </DialogDescription>
              </div>
            </DialogHeader>
          </div>
          
          {/* Barra de acciones y filtros */}
          <div className="bg-white border-b border-naval-100 px-3 sm:px-4 py-2 flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center">
              <span className="text-xs text-naval-700 font-medium">{productosFiltrados.length} productos</span>
            </div>
            <Button 
              variant={mostrarFiltros ? "default" : "outline"} 
              size="sm" 
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className={`text-xs transition-all duration-200 ${mostrarFiltros 
                ? "bg-naval-600 hover:bg-naval-700 text-white" 
                : "border-naval-200 hover:bg-naval-50 text-naval-700"}`}
            >
              {mostrarFiltros 
                ? <><X className="h-3 w-3 mr-1" /> Ocultar filtros</> 
                : <><Filter className="h-3 w-3 mr-1" /> Filtrar</>}
            </Button>
          </div>
          
          {/* Sección de filtros con animación */}
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${mostrarFiltros ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="bg-gradient-to-r from-naval-50 to-blue-50/30 p-3 sm:p-4 border-b border-naval-100 shadow-sm">
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 text-xs">
                <div className="bg-white p-2 rounded-md shadow-sm border border-naval-100">
                  <label className="text-naval-700 font-medium mb-1 text-xs flex items-center">
                    <span className="bg-naval-100/50 p-1 rounded-full mr-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/></svg>
                    </span>
                    Unidad
                  </label>
                  <select 
                    value={filtroUnidad}
                    onChange={(e) => setFiltroUnidad(e.target.value)}
                    className="w-full rounded-md border border-naval-200 text-xs py-1.5 px-2 focus:ring-1 focus:ring-naval-400 focus:border-naval-400 outline-none"
                  >
                    <option value="">Todas</option>
                    {unidadesUnicas.map((unidad, index) => (
                      <option key={index} value={unidad}>{unidad}</option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-white p-2 rounded-md shadow-sm border border-naval-100">
                  <label className="text-naval-700 font-medium mb-1 text-xs flex items-center">
                    <span className="bg-naval-100/50 p-1 rounded-full mr-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/></svg>
                    </span>
                    Marca
                  </label>
                  <select 
                    value={filtroMarca}
                    onChange={(e) => setFiltroMarca(e.target.value)}
                    className="w-full rounded-md border border-naval-200 text-xs py-1.5 px-2 focus:ring-1 focus:ring-naval-400 focus:border-naval-400 outline-none"
                  >
                    <option value="">Todas</option>
                    {marcasUnicas.map((marca, index) => (
                      <option key={index} value={marca}>{marca}</option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-white p-2 rounded-md shadow-sm border border-naval-100">
                  <label className="text-naval-700 font-medium mb-1 text-xs flex items-center">
                    <span className="bg-naval-100/50 p-1 rounded-full mr-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1"/><path d="M17 3h1a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-1"/><path d="M12 12h.01"/><path d="M12 22v-6"/><path d="M8 22h8"/><path d="M2 8h20"/></svg>
                    </span>
                    División
                  </label>
                  <select 
                    value={filtroDivision}
                    onChange={(e) => setFiltroDivision(e.target.value)}
                    className="w-full rounded-md border border-naval-200 text-xs py-1.5 px-2 focus:ring-1 focus:ring-naval-400 focus:border-naval-400 outline-none"
                  >
                    <option value="">Todas</option>
                    {divisionesUnicas.map((division, index) => (
                      <option key={index} value={division}>{division}</option>
                    ))}
                  </select>
                </div>
                
                <div className="bg-white p-2 rounded-md shadow-sm border border-naval-100">
                  <label className="text-naval-700 font-medium mb-1 text-xs flex items-center">
                    <span className="bg-naval-100/50 p-1 rounded-full mr-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                    </span>
                    Fecha inicio
                  </label>
                  <input 
                    type="date" 
                    value={filtroFechaInicio}
                    onChange={(e) => setFiltroFechaInicio(e.target.value)}
                    className="w-full rounded-md border border-naval-200 text-xs py-1.5 px-2 focus:ring-1 focus:ring-naval-400 focus:border-naval-400 outline-none"
                  />
                </div>
                
                <div className="bg-white p-2 rounded-md shadow-sm border border-naval-100">
                  <label className="text-naval-700 font-medium mb-1 text-xs flex items-center">
                    <span className="bg-naval-100/50 p-1 rounded-full mr-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                    </span>
                    Fecha fin
                  </label>
                  <input 
                    type="date" 
                    value={filtroFechaFin}
                    onChange={(e) => setFiltroFechaFin(e.target.value)}
                    className="w-full rounded-md border border-naval-200 text-xs py-1.5 px-2 focus:ring-1 focus:ring-naval-400 focus:border-naval-400 outline-none"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-4 pb-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={limpiarFiltros}
                  className="text-xs border-naval-200 hover:bg-naval-50 text-naval-700 transition-colors duration-200 w-full sm:w-auto"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpiar
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={aplicarFiltros}
                  className="text-xs bg-naval-600 hover:bg-naval-700 text-white transition-colors duration-200 shadow-sm w-full sm:w-auto"
                >
                  <Search className="h-3 w-3 mr-1" />
                  Aplicar filtros
                </Button>
              </div>
            </div>
          </div>
          
          {/* Estado de carga */}
          {cargandoHistorial ? (
            <div className="flex justify-center items-center h-[200px] bg-white">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-naval-600 mb-2" />
                <span className="text-naval-700 text-sm">Cargando historial...</span>
              </div>
            </div>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto">
              {/* Sin resultados */}
              {productosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] bg-white">
                  {errorHistorial ? (
                    <>
                      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
                        <X className="h-6 w-6 text-red-500" />
                      </div>
                      <h3 className="text-base font-semibold text-red-700 mb-1">Error en la consulta</h3>
                      <p className="text-red-500 text-center text-sm max-w-md">{errorHistorial}</p>
                    </>
                  ) : productosAgotados.length === 0 ? (
                    <>
                      <div className="w-12 h-12 bg-naval-50 rounded-full flex items-center justify-center mb-3">
                        <History className="h-6 w-6 text-naval-500" />
                      </div>
                      <h3 className="text-base font-semibold text-naval-700 mb-1">No se encontraron productos</h3>
                      <p className="text-naval-500 text-center text-sm max-w-md">No hay productos agotados en el historial.</p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-naval-50 rounded-full flex items-center justify-center mb-3">
                        <Filter className="h-6 w-6 text-naval-500" />
                      </div>
                      <h3 className="text-base font-semibold text-naval-700 mb-1">Sin resultados para los filtros</h3>
                      <p className="text-naval-500 text-center text-sm max-w-md">No se encontraron productos que coincidan con los filtros seleccionados.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Tabla de resultados compacta */}
                  <table className="w-full border-collapse text-xs min-w-[800px]">
                    <thead className="bg-naval-50">
                      <tr>
                        <th className="py-2 px-2 text-left text-naval-700 font-medium border-b border-gray-100 whitespace-nowrap">Unidad</th>
                        <th className="py-2 px-2 text-left text-naval-700 font-medium border-b border-gray-100 whitespace-nowrap">Código</th>
                        <th className="py-2 px-2 text-left text-naval-700 font-medium border-b border-gray-100 whitespace-nowrap">Lote</th>
                        <th className="py-2 px-2 text-left text-naval-700 font-medium border-b border-gray-100 whitespace-nowrap">Marca</th>
                        <th className="py-2 px-2 text-left text-naval-700 font-medium border-b border-gray-100 whitespace-nowrap">Div.</th>
                        <th className="py-2 px-2 text-left text-naval-700 font-medium border-b border-gray-100">Descripción</th>
                        <th className="py-2 px-2 text-left text-naval-700 font-medium border-b border-gray-100 whitespace-nowrap">Fecha</th>
                        <th className="py-2 px-2 text-center text-naval-700 font-medium border-b border-gray-100 whitespace-nowrap">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltrados.map((producto, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-naval-50/30 transition-colors">
                          <td className="py-2 px-2">
                            <span className="text-naval-700">{producto.unidadBase}</span>
                          </td>
                          <td className="py-2 px-2 overflow-hidden text-ellipsis">
                            <span className="font-medium text-naval-800">{producto.codigo}</span>
                          </td>
                          <td className="py-2 px-2 overflow-hidden text-ellipsis">
                            <span className="text-naval-800">{producto.lote}</span>
                          </td>
                          <td className="py-2 px-2">
                            <Badge className="bg-blue-50 text-blue-700 border-blue-100 px-1.5 py-0.5 text-[10px]">
                              {producto.marca}
                            </Badge>
                          </td>
                          <td className="py-2 px-2">
                            {producto.division && (
                              <div className="flex items-center gap-1">
                                <div 
                                  className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                                  style={{ 
                                    backgroundColor: getColorHexForDivision(producto.division),
                                    border: '1px solid rgba(0,0,0,0.1)' 
                                  }}
                                />
                                <span className="text-[10px] text-naval-700 truncate">{producto.division}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2 overflow-hidden text-ellipsis">
                            <span className="text-naval-800">{producto.descripcion}</span>
                          </td>
                          <td className="py-2 px-2 whitespace-nowrap">
                            <span className="text-naval-700 text-[10px]">
                              {new Date(producto.fechaEliminacion).toLocaleDateString('es-MX', {
                                year: '2-digit',
                                month: 'numeric',
                                day: 'numeric'
                              })}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0" 
                              onClick={() => verDetalleProducto(producto)}
                            >
                              <FileText className="h-3.5 w-3.5 text-naval-600" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          
          {/* Pie del modal */}
          <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setModalHistorialAbierto(false)}
              className="border-naval-200 text-naval-700 hover:bg-naval-50 px-4 py-1 text-xs"
              size="sm"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de detalle del producto */}
      <Dialog open={modalDetalleHistorialAbierto} onOpenChange={setModalDetalleHistorialAbierto}>
        <DialogContent className="w-[95vw] sm:max-w-[90vw] md:max-w-[500px] p-0 overflow-hidden bg-white rounded-lg shadow-md max-h-[90vh] overflow-y-auto">
          {/* Encabezado del modal */}
          <div className="bg-gradient-to-r from-blue-50 to-naval-50 p-4 border-b border-naval-100">
            <DialogHeader className="pb-0">
              <DialogTitle className="text-base font-bold text-naval-800 flex items-center">
                <FileText className="h-4 w-4 mr-2 text-naval-600" />
                Detalle del Producto
              </DialogTitle>
              <DialogDescription className="text-naval-600 mt-1 text-xs">
                Información completa del producto agotado
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Contenido del detalle */}
          {productoSeleccionadoHistorial && (
            <div className="p-4 max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="bg-naval-50/30 p-3 rounded-md">
                  <h3 className="font-semibold text-naval-800 text-base mb-1">{productoSeleccionadoHistorial.descripcion}</h3>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-blue-50 text-blue-700 border-blue-100">{productoSeleccionadoHistorial.marca}</Badge>
                    {productoSeleccionadoHistorial.division && (
                      <div className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded-full inline-block"
                          style={{ 
                            backgroundColor: getColorHexForDivision(productoSeleccionadoHistorial.division),
                            border: '1px solid rgba(0,0,0,0.1)' 
                          }}
                        />
                        <span className="text-xs text-naval-700">{productoSeleccionadoHistorial.division}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-naval-600 text-xs">Código: <span className="font-medium text-naval-800">{productoSeleccionadoHistorial.codigo}</span></p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-gray-100 rounded-md p-3">
                    <p className="text-xs text-naval-500 mb-1">Unidad Base</p>
                    <p className="font-medium text-naval-800">{productoSeleccionadoHistorial.unidadBase}</p>
                  </div>
                  <div className="border border-gray-100 rounded-md p-3">
                    <p className="text-xs text-naval-500 mb-1">Lote</p>
                    <p className="font-medium text-naval-800">{productoSeleccionadoHistorial.lote}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-gray-100 rounded-md p-3">
                    <p className="text-xs text-naval-500 mb-1">Línea</p>
                    <p className="font-medium text-naval-800">{productoSeleccionadoHistorial.linea || 'N/A'}</p>
                  </div>
                  <div className="border border-gray-100 rounded-md p-3">
                    <p className="text-xs text-naval-500 mb-1">Sublínea</p>
                    <p className="font-medium text-naval-800">{productoSeleccionadoHistorial.sublinea || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="border border-gray-100 rounded-md p-3">
                  <p className="text-xs text-naval-500 mb-1">Fecha de Eliminación</p>
                  <p className="font-medium text-naval-800">
                    {new Date(productoSeleccionadoHistorial.fechaEliminacion).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Pie del modal */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setModalDetalleHistorialAbierto(false)}
              className="border-naval-200 text-naval-700 hover:bg-naval-50 px-4 py-1 text-xs"
              size="sm"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de observaciones */}
      <Dialog open={modalObservacionesAbierto} onOpenChange={setModalObservacionesAbierto}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby="datos-salida-description">
          <DialogHeader>
            <DialogTitle>Datos para la salida</DialogTitle>
            <DialogDescription id="datos-salida-description">
              Complete la información requerida para generar la salida.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entregadoPor" className="font-medium">Entregado Por <span className="text-red-500">*</span></Label>
              <Input
                id="entregadoPor"
                placeholder="Nombre de quien entrega"
                className="border border-naval-200 focus-visible:ring-naval-500 bg-gray-50"
                value={entregadoPor}
                onChange={(e) => setEntregadoPor(e.target.value)}
                readOnly={!!nombreUsuario}
                required
              />
              {nombreUsuario && (
                <p className="text-xs text-green-600 mt-1">Campo completado automáticamente con tu nombre de usuario</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="areaDestino" className="font-medium">Área de Destino <span className="text-red-500">*</span></Label>
              <Select value={areaDestino} onValueChange={setAreaDestino}>
                <SelectTrigger className="border border-naval-200 focus-visible:ring-naval-500">
                  <SelectValue placeholder="Seleccione una división" />
                </SelectTrigger>
                <SelectContent>
                  <div className="max-h-[300px] overflow-y-auto">
                    {divisiones.map((division) => (
                      <SelectItem key={division.value} value={division.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: division.color }}
                          />
                          <span>{division.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="responsableArea" className="font-medium">Responsable del Área <span className="text-red-500">*</span></Label>
              <Select value={responsableArea} onValueChange={setResponsableArea}>
                <SelectTrigger className="border border-naval-200 focus-visible:ring-naval-500">
                  <SelectValue placeholder="Seleccione un responsable" />
                </SelectTrigger>
                <SelectContent>
                  {responsablesAreaOptions.map((responsable) => (
                    <SelectItem key={responsable} value={responsable}>
                      {responsable}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <textarea
                id="observaciones"
                placeholder="Ingrese observaciones (opcional)"
                className="w-full h-24 p-2 border border-naval-200 rounded-md focus:outline-none focus:ring-2 focus:ring-naval-500"
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
                disabled={generandoSalida}
              >
                {generandoSalida ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Generar Salida"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de comentarios específicos para cada presentación */}
      <Dialog open={modalComentarioAbierto} onOpenChange={setModalComentarioAbierto}>
        <DialogContent className="sm:max-w-[500px]" aria-describedby="comentario-especifico-description">
          <DialogHeader>
            <DialogTitle>Comentario específico para esta presentación</DialogTitle>
            <DialogDescription id="comentario-especifico-description">
              Este comentario se mostrará únicamente en el PDF para esta presentación específica.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comentarioEspecifico" className="font-medium">Comentario</Label>
              <textarea
                id="comentarioEspecifico"
                placeholder="Ingrese un comentario específico para esta presentación"
                className="w-full h-32 p-2 border border-naval-200 rounded-md focus:outline-none focus:ring-2 focus:ring-naval-500"
                value={comentarioActual}
                onChange={(e) => setComentarioActual(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setModalComentarioAbierto(false)}
                className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800"
              >
                Cancelar
              </Button>
              <Button 
                onClick={guardarComentario}
                className="bg-naval-600 hover:bg-naval-700 text-white"
              >
                Guardar comentario
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de carga durante la generación de la entrega */}
      <Dialog open={modalCargaAbierto} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[400px] flex flex-col items-center justify-center p-6 bg-white/95 backdrop-blur-sm z-50">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-naval-600" />
            <DialogTitle className="text-xl font-semibold text-naval-700">Procesando entrega</DialogTitle>
            <DialogDescription className="text-center">
              Por favor espere mientras se genera la entrega y el PDF correspondiente.
              <br />
              Este proceso puede tomar unos momentos.
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
