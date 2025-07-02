import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic'; // Asegura que la ruta no sea cacheada

export async function POST(request: Request) {
  try {
    console.log('API entrega: Iniciando procesamiento de solicitud');
    
    // Obtener los datos de la petición
    const datosOriginales = await request.json();
    
    // Transformar los datos al formato exacto que espera la API externa
    const datosFormateados = {
      entregadoPor: datosOriginales.entregadoPor || '',
      areaDestino: datosOriginales.areaDestino || '',
      responsableArea: datosOriginales.responsableArea || '',
      observaciones: datosOriginales.observaciones || '',
      lote: datosOriginales.lote || '', // Agregar campo lote a nivel global
      detalles: []
    };
    
    console.log('API entrega: Agregado campo lote a nivel global:', datosFormateados.lote);
    
    // Procesar cada detalle y asegurarse de que tenga el formato correcto
    if (datosOriginales.detalles && Array.isArray(datosOriginales.detalles)) {
      datosFormateados.detalles = datosOriginales.detalles.map((detalle: { id: string | number; lote?: string; cantidadEntregada: number; observaciones?: string; nombreProducto: string; [key: string]: any }) => {
        // Convertir el ID a string si es un número
        const idString = typeof detalle.id === 'number' ? detalle.id.toString() : detalle.id;
        
        // Crear un UUID si el ID no parece ser un UUID
        const idUUID = idString.includes('-') ? idString : `3fa85f64-5717-4562-b3fc-${idString.padStart(12, '0')}`.substring(0, 36);
        
        // Asegurarnos de que el campo lote siempre esté presente
        const detalleFormateado = {
          id: idUUID,
          lote: detalle.lote || '', // Si no existe, usar string vacío
          cantidadEntregada: detalle.cantidadEntregada || 0,
          observaciones: detalle.observaciones || '',
          nombreProducto: detalle.nombreProducto || ''
        };
        
        // Verificar explícitamente que lote esté presente
        if (!detalleFormateado.lote && detalleFormateado.lote !== '') {
          detalleFormateado.lote = '';
        }
        
        console.log(`API entrega: Detalle formateado con lote: ${JSON.stringify(detalleFormateado)}`);
        return detalleFormateado;
      });
    }
    
    console.log('API entrega: Datos transformados al formato esperado por la API externa');
    
    // Log para depuración - mostrar los datos completos
    console.log('API entrega: Datos recibidos (modificados) COMPLETOS:', JSON.stringify(datosFormateados, null, 2));
    
    // URL del endpoint real
    const baseUrl = process.env.NEXT_PUBLIC_ENTREGAS_API_URL;
    
    // Verificar que la URL existe
    if (!baseUrl) {
      console.error('API entrega: URL de entregas no configurada en variables de entorno');
      return NextResponse.json(
        { success: false, message: 'URL de entregas no configurada en variables de entorno' },
        { status: 500 }
      );
    }
    
    const entregaUrl = `${baseUrl}/generate/entrega`;
    console.log(`API entrega: URL del endpoint: ${entregaUrl}`);
    
    // Obtener el token de autenticación de las cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    // Si no hay token, devolver error
    if (!token) {
      console.error('API entrega: No se encontró token de autenticación');
      return NextResponse.json(
        { success: false, message: 'No se encontró token de autenticación' },
        { status: 401 }
      );
    }
    
    console.log('API entrega: Token de autenticación encontrado');
    
    // Reenviar la petición al servidor real con el token
    console.log('API entrega: Enviando petición al servidor externo...');
    console.log(`API entrega: URL del endpoint: ${entregaUrl}`);
    console.log('API entrega: Datos a enviar COMPLETOS:', JSON.stringify(datosFormateados, null, 2));
    console.log(`API entrega: Token: ${token.substring(0, 10)}...`);
    
    try {
      const response = await fetch(entregaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(datosFormateados),
        cache: 'no-store', // No cachear la respuesta
        next: { revalidate: 0 } // Forzar revalidación en cada petición
      });
      
      console.log(`API entrega: Respuesta recibida con status: ${response.status} ${response.statusText}`);
      
      // Obtener los datos de la respuesta como texto primero para depurar
      const responseText = await response.text();
      console.log(`API entrega: Respuesta como texto completa: ${responseText}`);
      console.log(`API entrega: Código de estado HTTP: ${response.status} ${response.statusText}`);
      
      // Intentar parsear la respuesta como JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('API entrega: Respuesta parseada como JSON correctamente');
      } catch (parseError) {
        console.error('API entrega: Error al parsear la respuesta como JSON:', parseError);
        return NextResponse.json(
          { success: false, message: 'Error al parsear la respuesta del servidor', responseText },
          { status: 500 }
        );
      }
      
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
    } catch (fetchError) {
      console.error('API entrega: Error al realizar la petición fetch:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Error al conectar con el servidor de entregas', error: String(fetchError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API entrega: Error general al procesar la solicitud de entrega:', error);
    return NextResponse.json(
      { success: false, message: 'Error al procesar la solicitud', error: String(error) },
      { status: 500 }
    );
  }
}
