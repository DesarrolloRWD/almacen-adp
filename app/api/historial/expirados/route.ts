import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Obtener el token de autenticación
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado: Token no proporcionado' },
        { status: 401 }
      );
    }

    // Construir la URL del API externo usando la variable de entorno
    const apiUrl = `${process.env.NEXT_PUBLIC_HISTORIAL_API_URL}/get/expirados`;
    
    // Realizar la solicitud al API externo
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en la respuesta del API:', errorText);
      return NextResponse.json(
        { error: `Error al obtener historial de productos expirados: ${response.status}` },
        { status: response.status }
      );
    }

    // Devolver los datos obtenidos
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error al obtener historial de productos expirados:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
