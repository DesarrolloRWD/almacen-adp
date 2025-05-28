import { NextRequest, NextResponse } from 'next/server'

// Definir los métodos HTTP permitidos
export const dynamic = 'force-dynamic' // No usar caché para esta ruta
export const runtime = 'nodejs' // Usar Node.js runtime

// Método POST para actualizar el estado del usuario
export async function POST(request: NextRequest) {
  try {
    // //console.log('Recibida solicitud POST para actualizar estado')
    const body = await request.json()
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'No se proporcionó token de autenticación' },
        { status: 401 }
      )
    }

    // Obtener la URL del endpoint desde las variables de entorno
    const baseUrl = process.env.NEXT_PUBLIC_USUARIOS_API_URL

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'URL de API de usuarios no configurada' },
        { status: 500 }
      )
    }
    
    const apiUrl = `${baseUrl}/api/update/status`

    // //console.log('Enviando solicitud a:', apiUrl)
    // //console.log('Datos:', body)

    // Realizar la solicitud al endpoint externo
    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    // //console.log('Respuesta recibida:', data)

    // Devolver la respuesta del servidor externo
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Error al actualizar estado del usuario:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
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
