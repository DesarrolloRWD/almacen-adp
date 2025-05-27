import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // URL de la API externa
    const baseUrl = process.env.NEXT_PUBLIC_ALMACEN_API_URL;
    
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'URL de API de almacén no configurada' },
        { status: 500 }
      );
    }
    
    const apiUrl = `${baseUrl}/api/get/products`;
    
    // Realizar la solicitud a la API externa
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        // Añadir cualquier header de autenticación si es necesario
      },
      // Importante para que Next.js no cachee la respuesta
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // Obtener los datos de la respuesta
    const data = await response.json();

    // Devolver los datos como respuesta
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los productos' },
      { status: 500 }
    );
  }
}
