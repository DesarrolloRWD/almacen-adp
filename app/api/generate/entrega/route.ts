import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // Obtener los datos de la petición
    const body = await request.json();
    
    // Log para depuración
    console.log('Datos enviados al endpoint de entregas:', body);
    
    // URL del endpoint real
    const baseUrl = process.env.NEXT_PUBLIC_ENTREGAS_API_URL;
    
    // Verificar que la URL existe
    if (!baseUrl) {
      return NextResponse.json(
        { success: false, message: 'URL de entregas no configurada en variables de entorno' },
        { status: 500 }
      );
    }
    
    const entregaUrl = `${baseUrl}/api/generate/entrega`;
    
    // Obtener el token de autenticación de las cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    // Si no hay token, devolver error
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No se encontró token de autenticación' },
        { status: 401 }
      );
    }
    
    // Reenviar la petición al servidor real con el token
    const response = await fetch(entregaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    
    // Obtener los datos de la respuesta
    const data = await response.json();
    
    // Log para depuración
    console.log('Respuesta del endpoint de entregas:', data);
    
    // Si la respuesta no es exitosa, devolver error
    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `Error del servidor: ${response.status} ${response.statusText}`, error: data },
        { status: response.status }
      );
    }
    
    // Devolver la respuesta exitosa
    return NextResponse.json(
      { success: true, message: 'Entrega generada exitosamente', data },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error al procesar la solicitud de entrega:', error);
    return NextResponse.json(
      { success: false, message: 'Error al procesar la solicitud', error: String(error) },
      { status: 500 }
    );
  }
}
