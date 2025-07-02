import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Definir los métodos HTTP permitidos
export const dynamic = 'force-dynamic' // No usar caché para esta ruta
export const runtime = 'nodejs' // Usar Node.js runtime

// Método POST para actualizar la información del usuario
export async function POST(request: NextRequest) {
  try {
    console.log('API users/update-information: Iniciando procesamiento de solicitud');
    
    const body = await request.json()
    
    // Obtener el token de autenticación de las cookies usando el método asíncrono
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.error('API users/update-information: No se encontró token de autenticación');
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }
    
    console.log('API users/update-information: Token de autenticación encontrado');

    // Obtener la URL del endpoint desde las variables de entorno
    const baseUrl = process.env.NEXT_PUBLIC_USUARIOS_API_URL

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'URL de API de usuarios no configurada' },
        { status: 500 }
      )
    }
    
    const apiUrl = `${baseUrl}/update/information`

    // //////console.log('Enviando solicitud a:', apiUrl)
    // //////console.log('Datos:', body)

    // Realizar la solicitud al endpoint externo
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    // Obtener la respuesta como JSON
    const data = await response.json()
    
    // //////console.log('Respuesta recibida:', data)

    // Devolver la respuesta
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error) {
    console.error('Error al actualizar información del usuario:', error)
    return NextResponse.json(
      { error: 'Error al actualizar información del usuario' },
      { status: 500 }
    )
  }
}

// Agregar método OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
