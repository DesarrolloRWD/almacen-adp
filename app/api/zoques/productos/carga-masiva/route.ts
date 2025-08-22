import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Obtener el token de autenticación del header
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    
    // También podemos obtener el token de la cookie directamente del request
    const cookieHeader = req.headers.get("cookie");
    const tokenFromCookie = cookieHeader?.split(';')
      .find(c => c.trim().startsWith('token='))?.split('=')[1] || "";
    
    // Usar el token del header o de la cookie
    const authToken = token || tokenFromCookie;
    
    if (!authToken) {
      console.error("[API][Zoques] Error: No se encontró token de autenticación");
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión nuevamente." },
        { status: 401 }
      );
    }

    // Obtener los datos del cuerpo de la petición
    const productos = await req.json();
    
    if (!Array.isArray(productos) || productos.length === 0) {
      console.error("[API][Zoques] Error: Formato de datos inválido", Array.isArray(productos) ? `(array vacío)` : `(tipo: ${typeof productos})`);
      return NextResponse.json(
        { error: "Formato de datos inválido. Se esperaba un array de productos." },
        { status: 400 }
      );
    }

    // Validar que cada producto tenga al menos código y descripción
    const productosInvalidos = productos.filter(p => !p.codigo || !p.descripcion);
    if (productosInvalidos.length > 0) {
      console.error(`[API][Zoques] Error: ${productosInvalidos.length} de ${productos.length} productos inválidos (sin código o descripción)`);
      return NextResponse.json(
        { 
          error: "Algunos productos no tienen los campos requeridos (código y descripción).",
          invalidCount: productosInvalidos.length,
          totalCount: productos.length
        },
        { status: 400 }
      );
    }
    
    // Asegurarse de que cada producto tenga todos los campos requeridos
    const productosCompletos = productos.map(p => {
      // Crear el objeto base sin el campo lote
      const productoBase = {
        codigo: p.codigo,
        descripcion: p.descripcion,
        catalogo: p.catalogo || p.codigo,
        marca: p.marca || "",
        unidad: p.unidad || "",
        // Agregar los campos adicionales requeridos
        division: p.division || "",
        linea: p.linea || "",
        sublinea: p.sublinea || "",
        temperatura: p.temperatura || "",
        pzsPorUnidad: p.pzsPorUnidad || 1,
        piezas: p.piezas || 0,
        fechaExpiracion: p.fechaExpiracion || new Date().toISOString().split('T')[0],
        tipoMovimiento: p.tipoMovimiento || "ENTRADA",
        movimientoArea: p.movimientoArea || "ALMACEN GENERAL"
      };
      
      // Solo agregar el campo lote si está presente y no es vacío
      if (p.lote !== undefined && p.lote !== null && p.lote !== "") {
        return { ...productoBase, lote: p.lote };
      }
      
      return productoBase;
    });
    
    // Solo mostrar información básica para no sobrecargar los logs
    console.log(`[API][Zoques] Productos procesados y validados: ${productosCompletos.length}`);
    
    // Solo mostrar información detallada si hay pocos productos (menos de 10)
    if (productosCompletos.length < 10) {
      // Verificar los campos nuevos del primer producto sin mostrar toda la estructura
      if (productosCompletos[0]) {
        // Mostrar un resumen más compacto del primer producto
        console.log(`[API][Zoques] Muestra del primer producto - Código: "${productosCompletos[0].codigo}", División: "${productosCompletos[0].division}", Línea: "${productosCompletos[0].linea}"`);
      }
    }

    // Configurar la URL correcta para el endpoint de guardar productos
    const apiBaseUrl = process.env.NEXT_PUBLIC_ZOQUES_API_URL;
    const endpoint = `${apiBaseUrl}/save/information`;
    
    // Evitar mostrar URLs completas en los logs
    console.log(`[API][Zoques] Enviando ${productosCompletos.length} productos al endpoint de guardado`);
    
    // Realizar la petición al servidor externo con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos de timeout
    
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify(productosCompletos),
        signal: controller.signal
      });
      
      // Limpiar el timeout
      clearTimeout(timeoutId);

      // Manejar la respuesta
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API][Zoques] Error ${response.status}: ${response.statusText}`, errorText ? `- ${errorText}` : "");
        // Solo mostrar headers relevantes
        const relevantHeaders = ['content-type', 'content-length', 'date'];
        const filteredHeaders = Object.fromEntries(
          Object.entries(Object.fromEntries(response.headers.entries()))
            .filter(([key]) => relevantHeaders.includes(key.toLowerCase()))
        );
        console.error(`[API][Zoques] Headers relevantes:`, filteredHeaders);
        
        return NextResponse.json(
          { 
            error: `Error del servidor: ${response.status}`,
            details: errorText
          },
          { status: response.status }
        );
      }

    // Intentar parsear la respuesta como JSON
    let data;
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch (error) {
        console.error("[API][Zoques] Error al parsear respuesta JSON:", error instanceof Error ? error.message : String(error));
        data = { message: "Productos guardados correctamente, pero hubo un error al procesar la respuesta." };
      }
    } else {
      const textResponse = await response.text();
      data = { message: textResponse || "Productos guardados correctamente." };
    }

    // Devolver la respuesta al cliente
    return NextResponse.json({
      success: true,
      productosProcesados: productos.length,
      ...data
    });
    
    } catch (error) {
      // Limpiar el timeout en caso de error
      clearTimeout(timeoutId);
      
      // Verificar si es un error de timeout
      if (error instanceof Error && error.name === 'AbortError') {
        console.error("[API][Zoques] Error: Timeout al conectar con el servidor externo (60s)");
        return NextResponse.json(
          { 
            error: "La operación tardó demasiado tiempo en completarse",
            message: "El servidor externo no respondió dentro del tiempo límite."
          },
          { status: 504 } // Gateway Timeout
        );
      }
      
      console.error("[API][Zoques] Error no controlado:", error instanceof Error ? `${error.name}: ${error.message}` : String(error));
      
      // Mensaje más detallado según el tipo de error
      let errorMessage = "Error desconocido";
      let statusCode = 500;
      
      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
          errorMessage = `No se pudo conectar al servidor: ${error.message}`;
          statusCode = 503; // Service Unavailable
        } else if (error.message.includes('ETIMEDOUT')) {
          errorMessage = `Tiempo de espera agotado al conectar con el servidor: ${error.message}`;
          statusCode = 504; // Gateway Timeout
        } else {
          errorMessage = error.message;
        }
      }
      
      return NextResponse.json(
        { 
          error: "Error al procesar la solicitud",
          message: errorMessage
        },
        { status: statusCode }
      );
    }
  } catch (error) {
    console.error("[API][Zoques] Error general:", error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { 
        error: "Error al procesar la solicitud",
        message: error instanceof Error ? error.message : "Error desconocido"
      },
      { status: 500 }
    );
  }
}
