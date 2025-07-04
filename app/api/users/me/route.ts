import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"

export const dynamic = 'force-dynamic'; // Asegura que la ruta no sea cacheada

// Función para decodificar el token JWT y extraer el nombre de usuario
function extractUsernameFromToken(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as { sub?: string }
    return decoded?.sub || null
  } catch (error) {
    console.error("Error al decodificar el token:", error)
    return null
  }
}

export async function GET(request: Request) {
  try {
    // Obtener el token de autenticación desde las cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    // Si no hay token, devolver error de autenticación
    if (!token) {
      console.warn('No se encontró token de autenticación para users/me');
      return NextResponse.json(
        { error: "No se proporcionó token de autenticación" },
        { status: 401 }
      )
    }
    
    // Extraer el nombre de usuario del token JWT
    const username = extractUsernameFromToken(token)
    
    if (!username) {
      return NextResponse.json(
        { error: "No se pudo extraer el nombre de usuario del token" },
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
    console.error("Error al obtener información del usuario actual:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    )
  }
}
