import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = 'force-dynamic'; // Asegura que la ruta no sea cacheada

export async function POST(request: Request) {
  try {
    // Obtener el token de autenticación desde las cookies usando el método asíncrono
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    // Si no hay token, devolver error de autenticación
    if (!token) {
      console.warn('No se encontró token de autenticación para usuarios/specific');
      return NextResponse.json(
        { error: "No se proporcionó token de autenticación" },
        { status: 401 }
      )
    }
    
    //console.log('Token de autenticación encontrado para usuarios/specific');
    
    // Obtener el nombre de usuario de la solicitud
    const body = await request.json()
    const username = body.value
    
    if (!username) {
      return NextResponse.json(
        { error: "No se proporcionó nombre de usuario" },
        { status: 400 }
      )
    }
    
    // URL del endpoint real
    const baseUrl = process.env.NEXT_PUBLIC_USUARIOS_API_URL
    
    if (!baseUrl) {
      return NextResponse.json(
        { error: "URL del API de usuarios no configurada" },
        { status: 500 }
      )
    }
    
    const specificUserUrl = `${baseUrl}/specific/user`
    
    // //console.log(`Obteniendo información del usuario: ${username}`)
    
    // Realizar la solicitud al servidor real
    const response = await fetch(specificUserUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ value: username })
    })
    
    if (!response.ok) {
      // console.error(`Error al obtener usuario específico: ${response.status} ${response.statusText}`)
      return NextResponse.json(
        { error: `Error del servidor: ${response.status}` },
        { status: response.status }
      )
    }
    
    // Obtener los datos de la respuesta
    const data = await response.json()
    // ////console.log("Datos del usuario obtenidos correctamente")
    
    // Devolver los datos al cliente
    return NextResponse.json(data)
  } catch (error) {
    // console.error("Error al obtener usuario específico:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    )
  }
}
