import { NextRequest, NextResponse } from 'next/server'

// Definir los métodos HTTP permitidos
export const dynamic = 'force-dynamic' // No usar caché para esta ruta
export const runtime = 'nodejs' // Usar Node.js runtime

// Método POST para actualizar la información del usuario
export async function POST(request: NextRequest) {
  try {
    // console.log('Recibida solicitud POST para actualizar información de usuario')
    const body = await request.json()
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener la URL del endpoint desde las variables de entorno
    const apiUrl = process.env.NEXT_PUBLIC_API_UPDATE_INFORMATION

    if (!apiUrl) {
      return NextResponse.json(
        { error: 'URL de API no configurada' },
        { status: 500 }
      )
    }

    // console.log('Enviando solicitud a:', apiUrl)
    // console.log('Datos:', body)

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
    
    // console.log('Respuesta recibida:', data)

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
