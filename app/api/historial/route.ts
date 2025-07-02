import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // Asegura que la ruta no sea cacheada

export async function GET() {
  try {
    const historialApiUrl = process.env.NEXT_PUBLIC_HISTORIAL_API_URL;
    
    if (!historialApiUrl) {
      console.error("URL de API de historial no configurada en variables de entorno");
      return NextResponse.json({ error: "URL de API de historial no configurada" }, { status: 500 });
    }

    // Usar la URL del API de historial
    const urlCompleta = `${historialApiUrl}/get/historial`;
    
    // Configurar los headers para la petición
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Obtener el token de autenticación desde las cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    // Agregar el token a los headers si existe
    if (token) {
      console.log('Token de autenticación encontrado para historial');
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('No se encontró token de autenticación para historial');
    }
    
    console.log(`Realizando petición a: ${urlCompleta}`);
    
    const response = await fetch(urlCompleta, {
      method: 'GET',
      headers,
      cache: 'no-store' // No cachear la respuesta
    });

    if (!response.ok) {
      console.error(`Error en la petición al API externa: ${response.status}`);
      return NextResponse.json(
        { error: `Error en la petición: ${response.status}`, details: await response.text() }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud", details: String(error) }, 
      { status: 500 }
    );
  }
}
