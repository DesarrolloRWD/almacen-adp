// Definición de tipos
export interface Producto {
  codigo: string
  descripcion: string
  catalogo: string
  unidad: string
  pzsPorUnidad: number
  piezas: number
  marca: string
  fechaExpiracion: string
  tipoMovimiento: string
  movimientoArea: string
}

export interface Presentacion {
  id: number
  tipoPresentacion: string
  descripcionPresentacion: string
  cantidad: number
  equivalenciaEnBase: number
  totalEquivalenciaEnBase: number
  lote: string
  item: {
    codigo: string
    descripcion: string
    id: number
  }
}

export interface Caja {
  id: string
  codigo: string
  nombre: string
  capacidad: number
  usado: number
  area: string
  fechaApertura: string
  responsable: string
  estado: string
  productos: {
    codigo: string
    nombre: string
    cantidad: number
  }[]
}

export interface Movimiento {
  id: number
  fecha: string
  tipo: string
  producto: {
    codigo: string
    descripcion: string
  }
  cantidad: number
  caja: string
  area: string
  usuario: {
    nombre: string
    avatar: string
    iniciales: string
  }
}

export interface User {
  id?: number
  correo: string
  nombre: string
  apdPaterno: string
  apdMaterno: string
  usuario: string
  curp: string
  telefono: string
  rfc: string
  image?: string | null
  roles: { nombre: string }[]
  pswd?: string
  fechaUltimoAcceso?: string
  estatus?: boolean
}

import { authGet, authPost, authPut } from "./auth-fetch"
import { API_ENDPOINTS } from "./config"
import { getTenantFromToken } from "./jwt-utils"

// Funciones para interactuar con la API
export async function getProductos(): Promise<Producto[]> {
  try {
    return await authGet(API_ENDPOINTS.GET_PRODUCTOS)
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return []
  }
}

export async function saveProducto(producto: Producto): Promise<{ success: boolean; message: string }> {
  try {
    await authPost(API_ENDPOINTS.SAVE_PRODUCTO, producto)
    return { success: true, message: "Producto guardado exitosamente" }
  } catch (error) {
    console.error("Error al guardar producto:", error)
    return { success: false, message: "Error al guardar el producto" }
  }
}

export async function updateProducto(producto: Producto): Promise<{ success: boolean; message: string }> {
  try {
    await authPut(API_ENDPOINTS.UPDATE_PRODUCTO, producto)
    return { success: true, message: "Producto actualizado exitosamente" }
  } catch (error) {
    console.error("Error al actualizar producto:", error)
    return { success: false, message: "Error al actualizar el producto" }
  }
}

export async function getProductosActivos(): Promise<Producto[]> {
  try {
    return await authPost(API_ENDPOINTS.GET_PRODUCTOS_ACTIVOS, {})
  } catch (error) {
    console.error("Error al obtener productos activos:", error)
    return []
  }
}

export async function saveProductoActivo(producto: Producto): Promise<{ success: boolean; message: string }> {
  try {
    await authPost(API_ENDPOINTS.ACTIVAR_PRODUCTO, producto)
    return { success: true, message: "Producto activo guardado exitosamente" }
  } catch (error) {
    console.error("Error al guardar producto activo:", error)
    return { success: false, message: "Error al guardar el producto activo" }
  }
}

export async function entregarProducto(producto: Producto): Promise<{ success: boolean; message: string }> {
  try {
    await authGet(API_ENDPOINTS.ENTREGAR_PRODUCTO)
    return { success: true, message: "Producto entregado exitosamente" }
  } catch (error) {
    console.error("Error al entregar producto:", error)
    return { success: false, message: "Error al entregar el producto" }
  }
}

export async function getPresentaciones(): Promise<Presentacion[]> {
  try {
    return await authGet(API_ENDPOINTS.GET_PRESENTACIONES)
  } catch (error) {
    // console.error("Error al obtener presentaciones:", error)
    return []
  }
}

export async function getPresentacionEspecifica(id: number): Promise<Presentacion | null> {
  try {
    // Usar POST en lugar de GET y enviar el ID en el cuerpo de la petición
    const response = await authPost(API_ENDPOINTS.GET_PRESENTACION_ESPECIFICA, { id })
    return response
  } catch (error) {
    // console.error("Error al obtener presentación específica:", error)
    return null
  }
}

export async function getPresentacionByCodigoLote(codigo: string, lote: string): Promise<Presentacion[]> {
  try {
    // Formato exacto como se muestra en Swagger
    const payload = {
      "codigo": codigo,
      "lote": lote
    };
    
    // Usar authPost para mantener la consistencia con el resto del código
    const response = await authPost(API_ENDPOINTS.GET_PRESENTACION_BY_CODIGO_LOTE, payload);
    
    // Verificar la estructura de los datos recibidos
    if (Array.isArray(response)) {
      // Mostrar detalles de cada presentación encontrada
      response.forEach((presentacion, index) => {
        // Asegurarnos de que el lote esté presente en cada presentación
        if (!presentacion.lote && lote) {
          console.warn(`Presentación ${index + 1} no tiene lote, asignando el lote de la búsqueda:`, lote);
          presentacion.lote = lote;
        }
        
       
      });
    }
    
    // Asegurarnos de que cada presentación tenga un lote
    const presentacionesConLote = Array.isArray(response) ? 
      response.map(p => {
        if (!p.lote && lote) {
          return { ...p, lote };
        }
        return p;
      }) : [];
    
    return presentacionesConLote;
  } catch (error) {
    return [];
  }
}

// Interfaz para la autenticación
export interface LoginCredentials {
  usuario: string
  pswd: string
}

export interface LoginResponse {
  token: string
  success: boolean
  message?: string
}

// Función para autenticar usuario (usa el endpoint de API local para evitar problemas de CORS)
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`)
    }

    const data = await response.json()
    
    // Verificar si la respuesta contiene un token (con o sin espacio)
    const tokenValue = data && (data.token || data['token ']);
    
    if (tokenValue) {
      return { 
        token: tokenValue, 
        success: true 
      }
    } else {
      // Si no hay token, considerar como error
      // console.error('No se encontró token en la respuesta:', data)
      return { 
        token: "", 
        success: false, 
        message: data.message || "Error de autenticación. Por favor verifique sus credenciales." 
      }
    }
  } catch (error) {
    // console.error("Error de autenticación:", error)
    return { 
      token: "", 
      success: false, 
      message: "Error de autenticación. Por favor verifique sus credenciales." 
    }
  }
}

// Funciones para gestionar usuarios
export async function getAllUsers(): Promise<User[]> {
  try {
    // Usar el endpoint proxy local en lugar del servidor externo directamente
    const response = await authGet(API_ENDPOINTS.ALL_USERS)
    return response || []
  } catch (error) {
    // console.error("Error al obtener usuarios:", error)
    return []
  }
}

export async function createUser(user: User): Promise<{ success: boolean; message: string }> {
  try {
    // Obtener el tenant del token JWT
    const tenantName = getTenantFromToken();
    
    // Crear una copia del usuario con el tenant incluido
    const userWithTenant = {
      ...user,
      tenant: {
        nombre: tenantName
      }
    };
    
    
    // Usar el endpoint proxy local en lugar del servidor externo directamente
    await authPost(API_ENDPOINTS.CREATE_USER, userWithTenant);
    return { success: true, message: "Usuario creado exitosamente" };
  } catch (error) {
    // console.error("Error al crear usuario:", error);
    return { success: false, message: "Error al crear el usuario" };
  }
}

export const getSpecificUser = async (username: string) => {
  try {
    const response = await authPost(API_ENDPOINTS.SPECIFIC_USER, { value: username })
    return response
  } catch (error) {
    // console.error('Error al obtener usuario específico:', error)
    throw error
  }
}

export const updateUserStatus = async (username: string, status: boolean) => {
  try {
    // Usar el endpoint local como proxy para evitar problemas de CORS
    const response = await authPost(API_ENDPOINTS.UPDATE_STATUS, { 
      value: username,
      status: status
    })
    return response
  } catch (error) {
    // console.error('Error al actualizar estado del usuario:', error)
    throw error
  }
}

export const updateUserImage = async (username: string, imageBase64: string) => {
  try {
    // Usar el endpoint local como proxy para evitar problemas de CORS
    const response = await authPost(API_ENDPOINTS.UPDATE_IMAGE, { 
      value: username,
      image: imageBase64
    })
    return response
  } catch (error) {
    // console.error('Error al actualizar imagen del usuario:', error)
    throw error
  }
}

// Interfaz para la información del usuario a actualizar
export interface UserInformationUpdate {
  correo?: string;
  pswd?: string;
  nombre?: string;
  apdPaterno?: string;
  apdMaterno?: string;
  usuario?: string;
  curp?: string;
  telefono?: string;
  rfc?: string;
  image?: string;
  roles?: { nombre: string }[];
}

// Función para actualizar toda la información del usuario
export const updateUserInformation = async (username: string, userInfo: UserInformationUpdate) => {
  try {
    // Usar el endpoint local como proxy para evitar problemas de CORS
    const response = await authPost(API_ENDPOINTS.UPDATE_INFORMATION, { 
      valueSearch: username,
      usuarioInformationRequest: userInfo
    })
    return response
  } catch (error) {
    // console.error('Error al actualizar información del usuario:', error)
    throw error
  }
}

// Interfaz para los datos de entrega
export interface EntregaData {
  entregadoPor: string;
  areaDestino: string;
  responsableArea: string;
  observaciones: string;
  detalles: {
    id: string | number; // Puede ser string (UUID) o number
    lote: string; // Campo requerido por la API externa
    cantidadEntregada: number;
    observaciones: string;
    nombreProducto: string;
  }[];
}

// Función para generar una entrega
export async function generateEntrega(entregaData: EntregaData): Promise<{ success: boolean; message: string }> {
  try {
    const response = await authPost(API_ENDPOINTS.GENERATE_ENTREGA, entregaData);

    return { success: true, message: "Entrega generada exitosamente" };
  } catch (error: any) {
    
    // Propagar el error para que podamos verlo en la consola
    throw error;
  }
}

// Interfaz para productos agotados del historial
export interface ProductoAgotado {
  codigo: string;
  descripcion: string;
  marca: string;
  unidadBase: string;
  division: string;
  linea: string;
  sublinea: string;
  lote: string;
  fechaEliminacion: string;
}

// Función para obtener el historial de productos agotados
export async function getHistorialProductosAgotados(): Promise<ProductoAgotado[]> {
  try {
    // Usar nuestra API route local como proxy para evitar problemas de CORS
    const response = await fetch('/historial', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data.map(item => item.payload) : [];
  } catch (error) {
    // console.error("Error al obtener historial de productos agotados:", error);
    return [];
  }
}

// Interfaz para los roles de usuario
export interface Role {
  nombre: string;
}

// Función para obtener todos los roles disponibles
export async function getRoles(): Promise<Role[]> {
  try {
    // Usar el endpoint local que actúa como proxy para el servidor externo
    const response = await authGet(API_ENDPOINTS.GET_ROLES);
    return Array.isArray(response) ? response : [];
  } catch (error) {
    // console.error("Error al obtener roles:", error);
    return [];
  }
}

// Exportar todas las funciones como un objeto API
export const api = {
  getProductos,
  saveProducto,
  getRoles,
  updateProducto,
  getProductosActivos,
  saveProductoActivo,
  entregarProducto,
  getPresentaciones,
  getPresentacionEspecifica,
  getPresentacionByCodigoLote,
  login,
  getAllUsers,
  createUser,
  getSpecificUser,
  updateUserStatus,
  updateUserImage,
  updateUserInformation,
  getHistorialProductosAgotados,
  generateEntrega,
}
