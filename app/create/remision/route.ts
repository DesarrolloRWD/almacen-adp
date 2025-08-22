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
    
    console.log(`URL de API de remisiones: ${apiUrl}`)
    console.log("Estructura de datos enviada:", JSON.stringify(data, null, 2))
    
    // Enviar datos a la API externa
    const targetUrl = `${apiUrl}/create/remision`
    console.log(`Enviando solicitud a: ${targetUrl}`)
    
    // Mantener la estructura original que espera la API
    // Solo asegurarnos que las cantidades sean números
    const { informacion, detalleRemision, tenant } = data
    
    // Convertir cantidades a números si son strings
    const formattedDetalleRemision = detalleRemision.map((item: any) => ({
      ...item,
      cantidad: typeof item.cantidad === 'string' ? parseInt(item.cantidad, 10) : item.cantidad
    }))
    
    // Mantener la estructura anidada como en Postman
    const formattedData = {
      informacion,
      detalleRemision: formattedDetalleRemision,
      tenant
    }
    
    console.log("Datos formateados:", JSON.stringify(formattedData, null, 2))
    
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(formattedData),
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
