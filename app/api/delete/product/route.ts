import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    // Obtener los datos del producto a eliminar del cuerpo de la solicitud
    const requestData = await request.json();
    console.log('Datos recibidos en el endpoint:', requestData);
    
    // Validar que se proporcione el ID del producto
    if (!requestData.id) {
      return NextResponse.json({ error: 'Se requiere el ID del producto' }, { status: 400 });
    }
    
    // Construir la URL del API externo usando la variable de entorno
    // Asegurarse de que la URL no tenga doble barra
    const baseUrl = process.env.NEXT_PUBLIC_ALMACEN_API_URL?.endsWith('/') 
      ? process.env.NEXT_PUBLIC_ALMACEN_API_URL.slice(0, -1) 
      : process.env.NEXT_PUBLIC_ALMACEN_API_URL;
    const apiUrl = `${baseUrl}/delete/product`;
    console.log('URL del API externo:', apiUrl);
    
    // Obtener el token de autenticación del header de la solicitud original
    const authHeader = request.headers.get('authorization');
    console.log('Token de autenticación:', authHeader ? 'Presente' : 'No presente');
    
    // Preparar los headers para la solicitud al API externo
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    // Si hay un token de autenticación, incluirlo en los headers
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    console.log('Headers para la solicitud:', headers);
    console.log('Datos enviados al API externo:', requestData);
    
    // Realizar la solicitud al API externo
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers,
      body: JSON.stringify(requestData)
    });
    
    console.log('Respuesta del API externo - Status:', response.status);
    
    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        console.error('Error al parsear la respuesta del API:', errorText);
        return NextResponse.json({ 
          error: 'Error al eliminar el producto', 
          statusCode: response.status,
          responseText: errorText
        }, { status: response.status });
      }
      
      console.error('Error del API externo:', errorData);
      return NextResponse.json({ 
        error: errorData.error || 'Error al eliminar el producto',
        statusCode: response.status,
        details: errorData
      }, { status: response.status });
    }
    
    // Devolver la respuesta exitosa
    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : { success: true };
    } catch (e) {
      console.log('Respuesta no JSON pero exitosa:', responseText);
      data = { success: true, message: responseText || 'Producto eliminado correctamente' };
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error en el endpoint de eliminación:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor', 
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
