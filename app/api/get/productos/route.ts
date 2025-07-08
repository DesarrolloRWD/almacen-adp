import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // Asegura que la ruta no sea cacheada

export async function GET() {
  try {
    // URL de la API externa
    const baseUrl = process.env.NEXT_PUBLIC_ALMACEN_API_URL;
    
    if (!baseUrl) {
      console.error('URL de API de almacén no configurada en variables de entorno');
      return NextResponse.json(
        { error: 'URL de API de almacén no configurada' },
        { status: 500 }
      );
    }
    
    const apiUrl = `${baseUrl}/get/products`;
    //////console.log('Intentando conectar a:', apiUrl);
    
    // Configurar los headers para la petición
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Obtener el token de autenticación de las cookies
    try {
      // En Next.js reciente, cookies() devuelve una promesa
      const cookieStore = await cookies();
      const token = cookieStore.get('token')?.value;
      
      // Si hay token, añadirlo a los headers
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        ////console.log('Token de autenticación añadido a la petición');
      } else {
        console.warn('No se encontró token de autenticación en las cookies');
      }
    } catch (error) {
      console.error('Error al obtener cookies:', error);
      // Continuamos sin token si hay error
    }
    
    // Realizar la solicitud a la API externa
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
      cache: 'no-store', // No cachear la respuesta
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error en la petición al API externa: ${response.status}`, errorText);
      return NextResponse.json(
        { 
          error: `Error en la petición: ${response.status}`, 
          details: errorText,
          url: apiUrl
        }, 
        { status: response.status }
      );
    }

    // Obtener los datos de la respuesta
    const data = await response.json();
    ////console.log('Datos recibidos correctamente de la API');

    // Devolver los datos como respuesta
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los productos', details: String(error) },
      { status: 500 }
    );
  }
}
