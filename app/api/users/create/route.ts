import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = 'force-dynamic'; // No cachear esta ruta

export async function POST(request: Request) {
  try {
    //console.log('API users/create: Iniciando procesamiento de solicitud');
    
    // Obtener el token de autenticación de las cookies usando el método asíncrono
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    // Verificar si hay token
    if (!token) {
      console.error('API users/create: No se encontró token de autenticación');
      return NextResponse.json(
        { error: "No se proporcionó token de autenticación" },
        { status: 401 }
      )
    }
    
    //console.log('API users/create: Token de autenticación encontrado');
    
    // Obtener los datos del usuario a crear
    const userData = await request.json()
    
    // URL del endpoint real
    const baseUrl = process.env.NEXT_PUBLIC_USUARIOS_API_URL
    
    if (!baseUrl) {
      return NextResponse.json(
        { error: "URL del API de usuarios no configurada" },
        { status: 500 }
      )
    }
    
    const createUserUrl = `${baseUrl}/save/information`
    
    // Realizar la solicitud al servidor real
    const response = await fetch(createUserUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(userData),
      cache: 'no-store' // No cachear la respuesta
    })
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Error del servidor: ${response.status}` },
        { status: response.status }
      )
    }
    
    // Obtener los datos de la respuesta
    const data = await response.json()
    
    // Devolver los datos al cliente
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al crear usuario:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    )
  }
}
