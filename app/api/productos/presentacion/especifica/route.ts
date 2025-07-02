import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'; // Asegura que la ruta no sea cacheada

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Obtener el token de autenticación desde las cookies usando el método asíncrono
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    // Si no hay token, devolver error de autenticación
    if (!token) {
      console.warn('No se encontró token de autenticación para presentacion especifica');
      return NextResponse.json(
        { error: 'No se proporcionó token de autenticación' },
        { status: 401 }
      );
    }
    
    console.log('Token de autenticación encontrado para presentacion especifica');
    
    // Construir la URL completa para el microservicio
    const apiUrl = `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/get/specific/presentacion`
    
    //////console.log('Enviando solicitud a:', apiUrl)
    //////console.log('Con datos:', body)
    
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
    //////console.log('Respuesta del microservicio:', data)
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error al procesar la solicitud:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
