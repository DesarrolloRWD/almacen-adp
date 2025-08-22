import { NextResponse, NextRequest } from 'next/server'

// URL de la API externa
const API_URL = process.env.NEXT_PUBLIC_ZOQUES_API_URL

export async function POST(request: NextRequest) {
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

    // Obtener los datos de la solicitud
    const requestData = await request.json();
    
    // Validar que tenga código y lote
    if (!requestData.codigo || !requestData.lote) {
      return NextResponse.json(
        { error: 'El código y lote son obligatorios para obtener el detalle del producto' },
        { status: 400 }
      );
    }

    // Enviar la solicitud a la API externa
    const response = await fetch(`${API_URL}/get/information`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(requestData)
    });

    // Manejar respuestas no exitosas
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API][Zoques] Error al obtener detalle del producto: ${errorText}`);
      
      return NextResponse.json(
        { error: `Error al obtener detalle del producto: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    // Intentar obtener la respuesta como texto primero
    const responseText = await response.text();
    
    // Si la respuesta está vacía pero el status es 200, consideramos que fue exitoso
    if (!responseText && response.status === 200) {
      return NextResponse.json({ success: true, data: null });
    }
    
    // Intentar parsear la respuesta como JSON
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (parseError) {
      // Si no es JSON pero el status es 200, consideramos que fue exitoso
      if (response.status === 200) {
        console.log('[API][Zoques] Respuesta no JSON pero exitosa:', responseText);
        return NextResponse.json({ success: true, data: responseText });
      }
      
      // Si no es JSON y el status no es 200, devolvemos un error
      console.error('[API][Zoques] Error al parsear respuesta:', parseError);
      return NextResponse.json(
        { error: 'Error al procesar la respuesta del servidor' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API][Zoques] Error al obtener detalle del producto:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
