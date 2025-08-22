import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Obtener datos de la solicitud
    const data = await request.json()
    
    // Obtener token de autorización del encabezado
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json(
        { error: "Token de autorización no proporcionado" },
        { status: 401 }
      )
    }
    
    // Obtener URL de la API de remisiones
    const apiUrl = process.env.NEXT_PUBLIC_REMISIONES_API_URL
    if (!apiUrl) {
      console.error("URL de API de remisiones no configurada")
      return NextResponse.json(
        { error: "Error de configuración del servidor" },
        { status: 500 }
      )
    }
    
    // Enviar datos a la API externa
    const targetUrl = `${apiUrl}/find/remision`
    
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(data),
    })
    
    // Manejar respuesta de la API externa
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error en API externa: ${response.status} - ${errorText}`)
      return NextResponse.json(
        { error: `Error en API externa: ${response.status}` },
        { status: response.status }
      )
    }
    
    // Devolver respuesta exitosa
    const responseData = await response.json()
    return NextResponse.json(responseData)
    
  } catch (error) {
    console.error("Error al procesar la solicitud:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    )
  }
}
