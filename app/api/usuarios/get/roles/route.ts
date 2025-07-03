import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = 'force-dynamic'; // Asegura que la ruta no sea cacheada

export async function GET() {
  try {
    // Obtener el token de autenticación desde las cookies usando el método asíncrono
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    // Si no hay token, devolver error de autenticación
    if (!token) {
      console.warn('No se encontró token de autenticación para roles');
      return NextResponse.json(
        { error: "No se proporcionó token de autenticación" },
        { status: 401 }
      )
    }
    
    console.log('Token de autenticación encontrado para roles');
    
    // URL del endpoint real
    const baseUrl = process.env.NEXT_PUBLIC_USUARIOS_API_URL
    
    if (!baseUrl) {
      return NextResponse.json(
        { error: "URL del API de usuarios no configurada" },
        { status: 500 }
      )
    }
    
    // Construir la URL correctamente

    const finalUrl = `${baseUrl}/get/roles`
    console.log("URL del endpoint de roles:", finalUrl)
    
    // Realizar la solicitud al servidor real
    console.log("Realizando solicitud al servidor externo para obtener roles...")
    const response = await fetch(finalUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
    
    console.log("Respuesta del servidor de roles:", response.status, response.statusText)
    
    if (!response.ok) {
      console.error("Error en la respuesta del servidor de roles:", response.status, response.statusText)
      return NextResponse.json(
        { error: `Error al obtener roles: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }
    
    // Obtener los datos de la respuesta
    const data = await response.json()
    console.log("Roles obtenidos:", JSON.stringify(data))
    
    // Devolver los datos como respuesta
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al procesar la solicitud de roles:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
