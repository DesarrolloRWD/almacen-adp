import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Obtener el token de la cookie o del encabezado de autorización
    const authHeader = req.headers.get('authorization')
    const token = authHeader ? authHeader.split(' ')[1] : null
    
    // Construir la URL completa para el microservicio
    const apiUrl = `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/api/get/specific/presentacion`
    
    ////console.log('Enviando solicitud a:', apiUrl)
    ////console.log('Con datos:', body)
    
    // Realizar la solicitud al microservicio
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    })
    
    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      console.error('Error del microservicio:', response.status, response.statusText)
      return NextResponse.json(
        { error: `Error del microservicio: ${response.status}` },
        { status: response.status }
      )
    }
    
    // Devolver la respuesta del microservicio
    const data = await response.json()
    ////console.log('Respuesta del microservicio:', data)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error al procesar la solicitud:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
