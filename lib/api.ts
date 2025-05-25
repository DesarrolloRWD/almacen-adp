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

// Funciones para interactuar con la API
export async function getProductos(): Promise<Producto[]> {
  try {
    return await authGet(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/get/productos`)
  } catch (error) {
    console.error("Error al obtener productos:", error)
    return []
  }
}

export async function saveProducto(producto: Producto): Promise<{ success: boolean; message: string }> {
  try {
    await authPost(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/save/information`, producto)
    return { success: true, message: "Producto guardado exitosamente" }
  } catch (error) {
    console.error("Error al guardar producto:", error)
    return { success: false, message: "Error al guardar el producto" }
  }
}

export async function updateProducto(producto: Producto): Promise<{ success: boolean; message: string }> {
  try {
    await authPut(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/update/producto`, producto)
    return { success: true, message: "Producto actualizado exitosamente" }
  } catch (error) {
    console.error("Error al actualizar producto:", error)
    return { success: false, message: "Error al actualizar el producto" }
  }
}

export async function getProductosActivos(): Promise<Producto[]> {
  try {
    return await authPost(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/get/productos/activos`, {})
  } catch (error) {
    console.error("Error al obtener productos activos:", error)
    return []
  }
}

export async function saveProductoActivo(producto: Producto): Promise<{ success: boolean; message: string }> {
  try {
    await authPost(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/save/active/producto`, producto)
    return { success: true, message: "Producto activo guardado exitosamente" }
  } catch (error) {
    console.error("Error al guardar producto activo:", error)
    return { success: false, message: "Error al guardar el producto activo" }
  }
}

export async function entregarProducto(producto: Producto): Promise<{ success: boolean; message: string }> {
  try {
    await authGet(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/save/active/entrega/producto`)
    return { success: true, message: "Producto entregado exitosamente" }
  } catch (error) {
    console.error("Error al entregar producto:", error)
    return { success: false, message: "Error al entregar el producto" }
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
    // Usar el endpoint de API local en lugar del servidor externo directamente
    const response = await fetch(`/api/auth/login`, {
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
    
    // Log para depuración
    // console.log('Respuesta procesada en api.ts:', data)
    
    // Verificar si la respuesta contiene un token (con o sin espacio)
    const tokenValue = data && (data.token || data['token ']);
    
    if (tokenValue) {
      return { 
        token: tokenValue, 
        success: true 
      }
    } else {
      // Si no hay token, considerar como error
      console.error('No se encontró token en la respuesta:', data)
      return { 
        token: "", 
        success: false, 
        message: data.message || "Error de autenticación. Por favor verifique sus credenciales." 
      }
    }
  } catch (error) {
    console.error("Error de autenticación:", error)
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
    const response = await authGet(`/api/users`)
    return response || []
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return []
  }
}

export async function createUser(user: User): Promise<{ success: boolean; message: string }> {
  try {
    // Usar el endpoint proxy local en lugar del servidor externo directamente
    await authPost(`/api/users/create`, user)
    return { success: true, message: "Usuario creado exitosamente" }
  } catch (error) {
    console.error("Error al crear usuario:", error)
    return { success: false, message: "Error al crear el usuario" }
  }
}

export const getSpecificUser = async (username: string) => {
  try {
    const response = await authPost(`/api/users/specific`, { value: username })
    return response
  } catch (error) {
    console.error('Error al obtener usuario específico:', error)
    throw error
  }
}

export const updateUserStatus = async (username: string, status: boolean) => {
  try {
    // Usar el endpoint local como proxy para evitar problemas de CORS
    const response = await authPost(`/api/users/update-status`, { 
      value: username,
      status: status
    })
    return response
  } catch (error) {
    console.error('Error al actualizar estado del usuario:', error)
    throw error
  }
}

export const updateUserImage = async (username: string, imageBase64: string) => {
  try {
    // Usar el endpoint local como proxy para evitar problemas de CORS
    const response = await authPost(`/api/users/update-image`, { 
      value: username,
      image: imageBase64
    })
    return response
  } catch (error) {
    console.error('Error al actualizar imagen del usuario:', error)
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
    const response = await authPost(`/api/users/update-information`, { 
      valueSearch: username,
      usuarioInformationRequest: userInfo
    })
    return response
  } catch (error) {
    console.error('Error al actualizar información del usuario:', error)
    throw error
  }
}

// Exportar todas las funciones como un objeto API
export const api = {
  getProductos,
  saveProducto,
  updateProducto,
  getProductosActivos,
  saveProductoActivo,
  entregarProducto,
  login,
  getAllUsers,
  createUser,
  getSpecificUser,
  updateUserStatus,
  updateUserImage,
  updateUserInformation
}
