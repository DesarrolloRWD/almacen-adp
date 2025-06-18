import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Obtener el token de la solicitud
    const authHeader = request.headers.get("Authorization")
    
    if (!authHeader) {
      return NextResponse.json(
        { error: "No se proporcionó token de autenticación" },
        { status: 401 }
      )
    }
    
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
        "Authorization": authHeader,
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
