import { NextResponse, NextRequest } from 'next/server'

// URL de la API externa
const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function PUT(request: NextRequest) {
  try {
    // Obtener el token de autenticación del header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    
    // También podemos obtener el token de la cookie directamente del request
    const cookieHeader = request.headers.get("cookie");
    const tokenFromCookie = cookieHeader?.split(';')
      .find(c => c.trim().startsWith('token='))?.split('=')[1] || "";
    
    // Usar el token del header o de la cookie
    const authToken = token || tokenFromCookie;
    
    if (!authToken) {
      console.error("[API][Zoques] Error: No se encontró token de autenticación");
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión nuevamente." },
        { status: 401 }
      );
    }

    // Obtener los datos del producto a actualizar
    const productoData = await request.json()
    
    // Validar que el producto tenga al menos el código
    if (!productoData.codigoRequest || !productoData.codigoRequest.codigo) {
      return NextResponse.json(
        { error: 'El código del producto es obligatorio para actualizar' },
        { status: 400 }
      )
    }
    
    // Validar que tenga al menos un campo para actualizar
    if (!productoData.lote && !productoData.fechaExpiracion && !productoData.descripcionCorta) {
      return NextResponse.json(
        { error: 'Debe proporcionar al menos un campo para actualizar (lote, fechaExpiracion o descripcionCorta)' },
        { status: 400 }
      )
    }

    // Configurar la URL correcta para el endpoint de actualizar productos
    const apiBaseUrl = process.env.NEXT_PUBLIC_ZOQUES_API_URL;
    const endpoint = `${apiBaseUrl}/update/information`;
    
    // Enviar la solicitud a la API externa
    const response = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(productoData)
    })

    // Manejar respuestas no exitosas
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[API][Zoques] Error al actualizar producto: ${errorText}`)
      
      return NextResponse.json(
        { error: `Error al actualizar producto: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    // Intentar obtener la respuesta como texto primero
    const responseText = await response.text()
    
    // Si la respuesta está vacía pero el status es 200, consideramos que fue exitoso
    if (!responseText && response.status === 200) {
      return NextResponse.json({ success: true })
    }
    
    // Intentar parsear la respuesta como JSON
    try {
      const data = JSON.parse(responseText)
      return NextResponse.json(data)
    } catch (parseError) {
      // Si no es JSON pero el status es 200, consideramos que fue exitoso
      if (response.status === 200) {
        console.log('[API][Zoques] Respuesta no JSON pero exitosa:', responseText)
        return NextResponse.json({ success: true })
      }
      
      // Si no es JSON y el status no es 200, devolvemos un error
      console.error('[API][Zoques] Error al parsear respuesta:', parseError)
      return NextResponse.json(
        { error: 'Error al procesar la respuesta del servidor' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[API][Zoques] Error al actualizar producto:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
