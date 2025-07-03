import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // No cachear esta ruta

export async function POST(request: Request) {
  try {
    // Obtener los datos de la petición
    const body = await request.json();
    
    
    // URL del endpoint de login real
    const baseUrl = process.env.NEXT_PUBLIC_AUTH_API_URL;
    
    // Verificar que la URL existe
    if (!baseUrl) {
      return NextResponse.json(
        { success: false, message: 'URL de autenticación no configurada en variables de entorno' },
        { status: 500 }
      );
    }
    
    const loginUrl = `${baseUrl}/login`;
    
    // Reenviar la petición al servidor real
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Si la respuesta no es exitosa, devolver un error
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `Error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Obtener los datos de la respuesta
    const data = await response.json();
    

    
    // Verificar si la respuesta contiene un token (con o sin espacio)
    const tokenValue = data && (data.token || data['token ']);
    
    if (tokenValue) {
      // Normalizar la respuesta para que siempre tenga la propiedad 'token' sin espacio
      return NextResponse.json({ token: tokenValue, success: true });
    } else if (data && typeof data === 'string') {
      // Si la respuesta es un string, podría ser el token directamente
      return NextResponse.json({ token: data, success: true });
    } else {
      // Intentar buscar el token en otras propiedades
      const possibleToken = data?.accessToken || data?.access_token || data?.auth_token || data?.authToken;
      if (possibleToken) {
        return NextResponse.json({ token: possibleToken, success: true });
      } else {
        // No se encontró un token, devolver la respuesta tal cual
        return NextResponse.json(data);
      }
    }
  } catch (error) {
    console.error('Error en el endpoint de login:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
