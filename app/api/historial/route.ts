import { NextResponse } from 'next/server';

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
    
    const response = await fetch(urlCompleta, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store' // No cachear la respuesta
    });

    if (!response.ok) {
      console.error(`Error en la petición al API externa: ${response.status}`);
      return NextResponse.json(
        { error: `Error en la petición: ${response.status}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" }, 
      { status: 500 }
    );
  }
}
