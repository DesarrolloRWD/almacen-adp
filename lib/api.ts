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
    console.log('Respuesta procesada en api.ts:', data)
    
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
