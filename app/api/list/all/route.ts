import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Obtener token de la cabecera de autorización
    const token = request.headers.get("Authorization")?.split(" ")[1] || "";
    
    // URL de la API externa
    const baseUrl = process.env.NEXT_PUBLIC_ZOQUES_API_URL;
    
    if (!baseUrl) {
      console.error('URL de API de almacén no configurada en variables de entorno');
      return NextResponse.json(
        { error: 'URL de API de almacén no configurada' },
        { status: 500 }
      );
    }
    
    // Endpoint para obtener todos los productos
    // Usar la ruta correcta según la API externa
    const apiUrl = `${baseUrl}/list/all`;
    
    console.log(`Realizando petición a: ${apiUrl}`);
    
    // Realizar la solicitud a la API externa
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
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
    
    // Obtener los datos de la respuesta como texto primero
    const responseText = await response.text();
    
    // Verificar si hay contenido en la respuesta
    if (!responseText || responseText.trim() === "") {
      console.log("La API externa devolvió una respuesta vacía, pero con status OK");
      return NextResponse.json({ data: [] });
    }
    
    // Intentar parsear la respuesta como JSON
    try {
      const data = JSON.parse(responseText);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error("Error al parsear la respuesta como JSON:", parseError);
      console.log("Contenido de la respuesta:", responseText);
      return NextResponse.json({ data: [], error: "Formato de respuesta no válido" });
    }
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return NextResponse.json(
      { error: 'No se pudieron cargar los productos', details: String(error) },
      { status: 500 }
    );
  }
}
