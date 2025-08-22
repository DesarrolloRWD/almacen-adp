import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt-utils"

// Definición local de interfaces
interface ProductoRemision {
  codigo: string;
  cantidad: string;
  unidad: string;
  descripcion: string;
}

interface Remision {
  informacion: {
    ordenRemision: string;
    fechaSalida: string;
    hospital: string;
    tipoSalida: string;
    almacenProveniente: string;
  };
  detalleRemision: ProductoRemision[];
}

export async function POST(request: NextRequest) {
  try {
    // Verificar token de autenticación
    const token = request.headers.get("Authorization")?.split(" ")[1] || ""
    const isValidToken = verifyToken(token)
    
    if (!isValidToken) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 401 }
      )
    }
    
    // Obtener datos de la solicitud
    const requestData = await request.json()
    const { informacion, detalleRemision, tenant } = requestData
    
    // Validar datos requeridos
    if (!informacion || !detalleRemision || detalleRemision.length === 0) {
      return NextResponse.json(
        { error: "Datos de remisión incompletos" },
        { status: 400 }
      )
    }
    
    // Validar campos obligatorios de la información
    const { ordenRemision, fechaSalida, hospital, tipoSalida, almacenProveniente } = informacion
    if (!ordenRemision || !fechaSalida || !hospital || !tipoSalida || !almacenProveniente) {
      return NextResponse.json(
        { error: "Información de remisión incompleta" },
        { status: 400 }
      )
    }
    
    // Validar productos
    for (const producto of detalleRemision) {
      if (!producto.codigo || !producto.cantidad || !producto.unidad || !producto.descripcion) {
        return NextResponse.json(
          { error: "Datos de producto incompletos" },
          { status: 400 }
        )
      }
    }
    
    // Preparar datos para enviar a la API externa
    const remisionData: Remision = {
      informacion: {
        ordenRemision,
        fechaSalida,
        hospital,
        tipoSalida,
        almacenProveniente,
      },
      detalleRemision: detalleRemision.map((producto: ProductoRemision) => ({
        codigo: producto.codigo,
        cantidad: producto.cantidad,
        unidad: producto.unidad,
        descripcion: producto.descripcion,
      })),
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
    
    console.log("Enviando remisión a API externa:", JSON.stringify(remisionData))
    
    // Enviar datos a la API externa
    const response = await fetch(`${apiUrl}/create/remision`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(remisionData),
    })
    
    // Manejar respuesta de la API externa
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error de API externa:", errorText)
      return NextResponse.json(
        { error: `Error al crear remisión: ${response.status}` },
        { status: response.status }
      )
    }
    
    // Intentar obtener respuesta como JSON
    let responseData
    try {
      const responseText = await response.text()
      
      // Verificar si hay contenido en la respuesta
      if (responseText && responseText.trim() !== "") {
        try {
          responseData = JSON.parse(responseText)
        } catch (parseError) {
          console.warn("La respuesta no es un JSON válido:", responseText)
          // Si la respuesta no es JSON pero el status es 200, asumimos éxito
          if (response.status === 200) {
            responseData = { success: true }
          }
        }
      } else {
        // Respuesta vacía pero status 200, asumimos éxito
        if (response.status === 200) {
          responseData = { success: true }
        }
      }
    } catch (error) {
      console.error("Error al procesar respuesta:", error)
      responseData = { success: true } // Asumimos éxito si hay error al procesar pero status es 200
    }
    
    return NextResponse.json(responseData || { success: true })
  } catch (error) {
    console.error("Error al procesar solicitud:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
