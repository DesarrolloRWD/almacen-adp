import { NextRequest, NextResponse } from 'next/server';

// Función para obtener el token de autorización de las cookies
function getAuthToken(request: NextRequest): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(cookie => cookie.trim());
  const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));
  
  if (!tokenCookie) return null;
  return tokenCookie.split('=')[1];
}

export async function POST(request: NextRequest) {
  try {
    // Obtener el token de autorización
    const token = getAuthToken(request);
    
    // Si no hay token, devolver error de autenticación
    if (!token) {
      return NextResponse.json(
        { error: 'No se proporcionó token de autenticación' },
        { status: 401 }
      );
    }
    
    // Obtener los datos del cuerpo de la solicitud
    const body = await request.json();
    const { codigo, lote } = body;
    
    //console.log('Buscando presentaciones con:', { codigo, lote });
    
    // URL de la API externa
    const apiUrl = process.env.NEXT_PUBLIC_ALMACEN_API_URL + '/api/get/presentation/by/codigo/lote';
    
    // Realizar la solicitud a la API externa
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ codigo, lote })
    });
    
    // Si la respuesta no es exitosa, devolver el error
    if (!response.ok) {
      console.error(`Error en API externa: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Error en API externa: ${response.status}` },
        { status: response.status }
      );
    }
    
    // Obtener los datos de la respuesta
    const data = await response.json();
    //console.log('Respuesta de API externa:', data);
    
    // Devolver los datos
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
