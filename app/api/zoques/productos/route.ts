import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Obtener el token de autorización de los headers
    const authHeader = req.headers.get("authorization");
    const token = authHeader ? authHeader.split(" ")[1] : "";
    
    if (!token) {
      return NextResponse.json(
        { error: "No autorizado: Token no proporcionado" },
        { status: 401 }
      );
    }

    // Obtener la URL base de la API de Zoques desde las variables de entorno
    const zoquesApiUrl = process.env.NEXT_PUBLIC_ZOQUES_API_URL;
    
    if (!zoquesApiUrl) {
      console.error("NEXT_PUBLIC_ZOQUES_API_URL no está definida en las variables de entorno");
      return NextResponse.json(
        { error: "Error de configuración del servidor" },
        { status: 500 }
      );
    }

    // Construir la URL completa
    const apiUrl = `${zoquesApiUrl}/list/all`;
    // console.log(`Realizando solicitud a: ${apiUrl}`);

    // Realizar la solicitud a la API externa
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error(`Error en la API externa: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Error al obtener datos: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Obtener los datos de la respuesta
    const data = await response.json();
    
    // Devolver los datos como respuesta
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
