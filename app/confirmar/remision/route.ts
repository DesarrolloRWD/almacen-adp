import { NextResponse } from "next/server"
import { getAlmacenGeneralToken } from "@/lib/token-utils"

export async function POST(request: Request) {
  try {
    // Obtener datos de la solicitud
    const data = await request.json()
    
    console.log("Datos recibidos para confirmación:", JSON.stringify(data))
    
    // Validar que los campos requeridos estén presentes
    if (!data.id || data.confirmacionRecibido === undefined || !data.confirmadoPor) {
      console.error("Faltan campos requeridos en la solicitud de confirmación")
      return NextResponse.json(
        { error: "Faltan campos requeridos", success: false },
        { status: 400 }
      )
    }
    
    // Obtener URL de la API de confirmaciones
    const apiUrl = process.env.NEXT_PUBLIC_CONFIRMACIONES_API_URL
    if (!apiUrl) {
      console.error("URL de API de confirmaciones no configurada")
      return NextResponse.json(
        { error: "Error de configuración del servidor", success: false },
        { status: 500 }
      )
    }
    
    // Obtener token con el tenant del almacén general
    // Si hay un token en la solicitud, lo modificamos, si no, creamos uno nuevo
    try {
      const userToken = request.headers.get("authorization")?.replace("Bearer ", "") || ""
      const token = getAlmacenGeneralToken(userToken || undefined)
      
      // Preparar los datos para enviar
      const confirmacionData = {
        id: data.id,
        confirmacionRecibido: data.confirmacionRecibido,
        confirmadoPor: data.confirmadoPor,
        observaciones: data.observaciones || ""
      }
      
      // console.log(`Enviando confirmación a: ${apiUrl}/update/confirmacion`)
      // console.log(`Datos enviados: ${JSON.stringify(confirmacionData)}`)
      
      // Enviar la solicitud a la API externa
      const response = await fetch(`${apiUrl}/update/confirmacion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(confirmacionData)
      })
      
      // Verificar si la respuesta fue exitosa
      if (!response.ok) {
        let errorMessage = "";
        try {
          const errorData = await response.json();
          errorMessage = JSON.stringify(errorData);
        } catch {
          try {
            errorMessage = await response.text();
          } catch {
            errorMessage = `Código de estado: ${response.status}`;
          }
        }
        
        console.error(`Error en API externa: ${response.status} - ${errorMessage}`);
        
        // Aunque hubo un error en la API externa, devolvemos 200 para que el frontend
        // pueda manejar la respuesta y mostrar el mensaje adecuado
        return NextResponse.json(
          { 
            error: `Error en la API externa: ${response.status}`, 
            details: errorMessage,
            success: false 
          },
          { status: 200 } // Devolvemos 200 en lugar del código de error
        );
      }
      
      // Intentar obtener la respuesta como JSON
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        // Si no es JSON, devolver el texto
        const textResponse = await response.text();
        responseData = { message: textResponse };
      }
      
      // Devolver la respuesta de la API externa con éxito
      return NextResponse.json({
        ...responseData,
        success: true
      });
      
    } catch (tokenError) {
      console.error("Error al generar o procesar el token:", tokenError);
      return NextResponse.json(
        { 
          error: "Error al procesar la autenticación", 
          details: tokenError instanceof Error ? tokenError.message : "Error desconocido",
          success: false 
        },
        { status: 200 } // Devolvemos 200 para que el frontend pueda manejar el error
      );
    }
    
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return NextResponse.json(
      { 
        error: "Error interno del servidor", 
        details: error instanceof Error ? error.message : "Error desconocido",
        success: false 
      },
      { status: 200 } // Devolvemos 200 para que el frontend pueda manejar el error
    );
  }
}
