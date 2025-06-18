import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Método POST para guardar un nuevo producto
export async function POST(request: NextRequest) {
  try {
    // Obtener el token de la solicitud
    const authHeader = request.headers.get("Authorization")
    let token = authHeader ? authHeader.replace("Bearer ", "") : null
    
    // Si no hay token en los headers, intentar obtenerlo de las cookies
    if (!token) {
      token = request.cookies.get('token')?.value || null
    }
    
    // Verificar si hay token
    if (!token) {
      console.error("No se encontró token de autorización")
      return NextResponse.json(
        { error: "No autorizado", details: "No se encontró token de autenticación" },
        { status: 401 }
      )
    }
    
    // Obtener los datos del cuerpo de la solicitud
    const body = await request.json()
    
    // Imprimir el cuerpo completo de la solicitud para depuración
    ////console.log("Cuerpo completo de la solicitud:", JSON.stringify(body, null, 2))
    
    // Asegurarnos de que la fecha de expiración tenga el formato correcto
    if (body.fechaExpiracion) {
      ////console.log("Fecha de expiración original:", body.fechaExpiracion)
      
      // Verificar si la fecha ya tiene el formato correcto
      if (!body.fechaExpiracion.endsWith('T00:00:00.000Z')) {
        // Formatear la fecha para asegurar que tenga el formato correcto
        const fechaBase = body.fechaExpiracion.split('T')[0]
        body.fechaExpiracion = `${fechaBase}T00:00:00.000Z`
      }
      
      ////console.log("Fecha de expiración formateada:", body.fechaExpiracion)
    }
    
    // Verificar que todos los campos requeridos estén presentes
    const camposRequeridos = [
      'codigo', 'descripcion', 'marca', 'unidadBase', 'division', 
      'linea', 'sublinea', 'lote', 'fechaExpiracion', 'minimos', 
      'maximos', 'creadoPor', 'cantidadNeta', 'presentaciones'
    ]
    
    const camposFaltantes = camposRequeridos.filter(campo => {
      if (campo === 'presentaciones') {
        return !body[campo] || !Array.isArray(body[campo]) || body[campo].length === 0
      }
      return body[campo] === undefined || body[campo] === null || body[campo] === ''
    })
    
    if (camposFaltantes.length > 0) {
      console.error("Campos requeridos faltantes:", camposFaltantes)
      return NextResponse.json(
        { 
          error: "Datos incompletos", 
          details: `Faltan los siguientes campos requeridos: ${camposFaltantes.join(', ')}` 
        },
        { status: 400 }
      )
    }
    
    // URL del endpoint real
    const baseUrl = process.env.NEXT_PUBLIC_ALMACEN_API_URL
    
    if (!baseUrl) {
      console.error("URL de API de almacén no configurada")
      return NextResponse.json(
        { error: "URL de API de almacén no configurada" },
        { status: 500 }
      )
    }
    
    const apiUrl = `${baseUrl}/save/product`
    
    ////console.log("Enviando solicitud a:", apiUrl)
    ////console.log("Con token:", token ? "[TOKEN PRESENTE]" : "[SIN TOKEN]")
    
    // Realizar la solicitud al endpoint externo
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })
    
    ////console.log("Respuesta del servidor:", response.status, response.statusText)
    
    // Si la respuesta es 401 (No autorizado), probablemente el token expiró
    if (response.status === 401) {
      const errorText = await response.text()
      console.error(`Error de autenticación: ${response.status}`, errorText)
      
      // Verificar si el error menciona token expirado
      if (errorText.includes("JWT expired") || errorText.includes("token expired")) {
        return NextResponse.json(
          { 
            error: "Token expirado", 
            details: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente para obtener un nuevo token.",
            originalError: errorText
          },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: "Error de autenticación", details: errorText },
        { status: 401 }
      )
    }
    
    // Si la respuesta no es exitosa por otras razones
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Error del servidor: ${response.status}`, errorText)
      
      // Intentar parsear el error como JSON para obtener más detalles
      try {
        const errorJson = JSON.parse(errorText)
        ////console.log("Error JSON parseado:", errorJson)
        
        // Si es un error de fecha de expiración, dar un mensaje más específico
        if (errorJson.message && errorJson.message.includes("Error en la fecha de expiracion")) {
          ////console.log("Detectado error de fecha de expiración")
          return NextResponse.json(
            { 
              error: "Error en la fecha de expiración", 
              details: "El formato de la fecha de expiración no es válido. Debe ser YYYY-MM-DDT00:00:00.000Z",
              originalError: errorText 
            },
            { status: 400 }
          )
        }
      } catch (e) {
        // Si no se puede parsear como JSON, continuar con el manejo normal
        ////console.log("No se pudo parsear el error como JSON:", e)
      }
      
      return NextResponse.json(
        { error: `Error del servidor: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }
    
    // Obtener la respuesta como JSON
    const data = await response.json()
    ////console.log("Respuesta exitosa del servidor")
    
    // Devolver la respuesta
    return NextResponse.json(data, {
      status: response.status
    })
  } catch (error) {
    console.error("Error al guardar producto:", error)
    return NextResponse.json(
      { error: "Error al procesar la solicitud", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
