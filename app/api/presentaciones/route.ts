import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // Asegura que la ruta no sea cacheada

export async function POST(request: Request) {
  try {
    // Obtener el token de autenticación desde las cookies usando el método asíncrono
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    // Si no hay token, devolver error de autenticación
    if (!token) {
      console.warn('No se encontró token de autenticación para presentaciones');
      return NextResponse.json(
        { error: 'No se proporcionó token de autenticación' },
        { status: 401 }
      );
    }
    
    //console.log('Token de autenticación encontrado para presentaciones');
    
    // Obtener los datos del cuerpo de la solicitud
    const body = await request.json();
    const { codigo, lote } = body;
    
    ////console.log('Buscando presentaciones con:', { codigo, lote });
    
    // URL de la API externa
    const apiUrl = process.env.NEXT_PUBLIC_ALMACEN_API_URL + '/get/presentation/by/codigo/lote';
    
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
    ////console.log('Respuesta de API externa:', data);
    
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
