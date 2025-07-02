import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // No cachear esta ruta

export async function POST(request: NextRequest) {
  try {
    console.log('API update/producto: Iniciando procesamiento de solicitud');
    
    // Obtener los datos del request
    const data = await request.json();
    console.log('API update/producto: Datos recibidos:', JSON.stringify(data).substring(0, 200) + '...');
    
    // URL de la API externa para actualizar productos
    const baseUrl = process.env.NEXT_PUBLIC_ALMACEN_API_URL;
    if (!baseUrl) {
      console.error('Error: Variable de entorno NEXT_PUBLIC_ALMACEN_API_URL no configurada');
      return NextResponse.json(
        { error: 'Error de configuración: URL de API no disponible' },
        { status: 500 }
      );
    }
    
    const apiUrl = `${baseUrl}/update/product`;
    
    console.log('API update/producto: Enviando a URL:', apiUrl);
    
    // Obtener el token de autenticación de las cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    // Si no hay token, devolver error
    if (!token) {
      console.error('API update/producto: No se encontró token de autenticación');
      return NextResponse.json(
        { error: 'No autorizado', details: 'No se encontró token de autenticación' },
        { status: 401 }
      );
    }
    
    console.log('API update/producto: Token de autenticación encontrado');
    
    // Intentar realizar la solicitud a la API externa
    try {
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
        cache: 'no-store' // No cachear la respuesta
      });
      
      // Verificar si la respuesta fue exitosa
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error de API (${response.status}):`, errorText);
        return NextResponse.json(
          { error: `Error de API: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }
      
      // Intentar obtener la respuesta como JSON
      try {
        const responseData = await response.json();
        //////console.log('Respuesta exitosa:', JSON.stringify(responseData, null, 2));
        return NextResponse.json(responseData);
      } catch (jsonError) {
        // Si no es JSON, devolver el texto como respuesta
        const responseText = await response.text();
        //////console.log('Respuesta exitosa (texto):', responseText);
        return NextResponse.json({ message: responseText || 'Operación exitosa' });
      }
    } catch (fetchError) {
      // Error de red o al realizar la solicitud
      console.error('Error de red:', fetchError);
      return NextResponse.json(
        { error: 'Error de conexión con la API externa' },
        { status: 500 }
      );
    }
  } catch (error) {
    // Error general (probablemente al procesar el JSON del request)
    console.error('Error general:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
