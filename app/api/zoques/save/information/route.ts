import { NextRequest, NextResponse } from "next/server";
import { NuevoProductoZoques } from "../../../../../lib/api";

export async function POST(request: NextRequest) {
  try {
    // Obtener el token de autenticación del header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : "";
    
    // También podemos obtener el token de la cookie directamente del request
    const cookieHeader = request.headers.get("cookie");
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

    // Obtener los datos del producto del cuerpo de la solicitud
    const requestData = await request.json();
    
    // Determinar si es un array o un objeto individual
    const productos = Array.isArray(requestData) ? requestData : [requestData];
    
    // Validar que los productos tengan al menos código y descripción
    if (productos.length === 0 || !productos.every(p => p.codigo && p.descripcion)) {
      console.error("[API][Zoques] Error: Datos de producto inválidos", productos.length > 0 ? `(${productos.length} productos)` : "");
      return NextResponse.json(
        { error: "El producto debe tener al menos código y descripción" },
        { status: 400 }
      );
    }

    // Log simplificado con la cantidad de productos
    console.log(`[API][Zoques] Guardando ${productos.length} producto(s)`);

    // Usar el array de productos directamente
    const productosArray = productos;
    
    // Configurar la URL correcta para el endpoint de guardar productos
    const apiBaseUrl = process.env.NEXT_PUBLIC_ZOQUES_API_URL;
    const endpoint = `${apiBaseUrl}/save/information`;
    
    // Enviar la solicitud al API externa
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authToken}`,
      },
      body: JSON.stringify(productosArray),
    });

    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API][Zoques] Error ${response.status}: ${response.statusText}`, errorText ? `- ${errorText}` : "");
      return NextResponse.json(
        { error: `Error ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Procesar la respuesta con manejo de errores para respuestas no JSON
    let data;
    try {
      // Intentar parsear la respuesta como JSON
      const responseText = await response.text();
      // Solo log si hay problemas con la respuesta
      if (!responseText) {
        console.log("[API][Zoques] Advertencia: Respuesta vacía de la API externa");
      }
      
      // Si hay contenido, intentar parsearlo como JSON
      data = responseText ? JSON.parse(responseText) : { success: true };
    } catch (parseError) {
      console.log("[API][Zoques] Advertencia: La respuesta no es un JSON válido, pero la operación parece exitosa");
      // Si no es JSON válido pero el status es 200, asumimos éxito
      data = { success: true };
    }
    
    console.log(`[API][Zoques] ${productos.length} producto(s) guardado(s) exitosamente`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API][Zoques] Error interno:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
