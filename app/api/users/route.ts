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
      console.warn('No se encontró token de autenticación para usuarios');
      return NextResponse.json(
        { error: "No se proporcionó token de autenticación" },
        { status: 401 }
      )
    }
    
    console.log('Token de autenticación encontrado para usuarios');
    
    // URL del endpoint real
    const baseUrl = process.env.NEXT_PUBLIC_USUARIOS_API_URL
    
    if (!baseUrl) {
      return NextResponse.json(
        { error: "URL del API de usuarios no configurada" },
        { status: 500 }
      )
    }
    
    const usersUrl = `${baseUrl}/get/all-users`
    // ////console.log("URL del endpoint de usuarios:", usersUrl)
    
    // Realizar la solicitud al servidor real
    // ////console.log("Realizando solicitud al servidor externo...")
    const response = await fetch(usersUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
    
    // ////console.log("Respuesta del servidor:", response.status, response.statusText)
    
    if (!response.ok) {
      console.error("Error en la respuesta del servidor:", response.status, response.statusText)
      return NextResponse.json(
        { error: `Error del servidor: ${response.status}` },
        { status: response.status }
      )
    }
    
    // Obtener los datos de la respuesta
    const data = await response.json()
    // ////console.log("Datos obtenidos del servidor:", JSON.stringify(data).substring(0, 200) + "...")
    
    // Asegurarse de que los datos estén en el formato correcto
    let formattedData = data
    
    // Si no es un array, intentar convertirlo
    if (!Array.isArray(data)) {
      if (data && typeof data === 'object') {
        // Buscar si hay alguna propiedad que sea un array
        const arrayProperty = Object.entries(data).find(([_, value]) => Array.isArray(value))
        if (arrayProperty) {
          formattedData = arrayProperty[1]
          // ////console.log("Datos convertidos a array desde la propiedad:", arrayProperty[0])
        } else {
          // Si no hay arrays, pero es un objeto, convertirlo a array de un elemento
          formattedData = [data]
          // ////console.log("Datos convertidos a array de un solo elemento")
        }
      }
    }
    
    // ////console.log("Enviando datos formateados al cliente")
    // Devolver los datos al cliente
    return NextResponse.json(formattedData)
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    )
  }
}
