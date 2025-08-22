import { NextResponse } from "next/server"
import { getAlmacenGeneralToken } from "@/lib/token-utils"

// Tenant del almacén general
const ALMACEN_GENERAL_TENANT = process.env.NEXT_PUBLIC_TENANT;

export async function POST(request: Request) {
  try {
    // Obtener datos de la solicitud
    const data = await request.json()
    
    // Obtener URL de la API de confirmaciones
    const apiUrl = process.env.NEXT_PUBLIC_CONFIRMACIONES_API_URL
    if (!apiUrl) {
      console.error("URL de API de confirmaciones no configurada")
      return NextResponse.json(
        { error: "Error de configuración del servidor" },
        { status: 500 }
      )
    }
    
    // Obtener token con el tenant del almacén general
    // Si hay un token en la solicitud, lo modificamos, si no, creamos uno nuevo
    const userToken = request.headers.get("authorization")?.replace("Bearer ", "") || ""
    const token = getAlmacenGeneralToken(userToken || undefined)
    
    // Preparar los datos con el tenant del almacén general
    const requestData = {
      ordenRemision: data.ordenRemision,
      tenant: ALMACEN_GENERAL_TENANT,
      destino: data.destino || "HospitalNaval"
    }
    
    // Enviar datos a la API externa usando el token fresco del almacén general
    const targetUrl = `${apiUrl}/find/remision`
    
    // console.log(`Enviando solicitud a: ${targetUrl}`)
    // console.log(`Datos enviados: ${JSON.stringify(requestData)}`)
    
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
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
