// Función para obtener el token del localStorage o cookies
const getAuthToken = (): string | null => {
  // Primero intentar obtener de localStorage (cliente)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) return token
    
    // Si no está en localStorage, intentar obtener de cookies
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift() || null
      return null
    }
    
    return getCookie('token')
  }
  
  return null
}

// Función para realizar peticiones autenticadas
export const authFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken()
  
  // Configuración por defecto
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  }
  
  // Combinar opciones
  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  }
  
  // Realizar la petición
  const response = await fetch(url, fetchOptions)
  
  // Si la respuesta es 401 (No autorizado), redirigir al login
  if (response.status === 401 && typeof window !== 'undefined') {
    // Limpiar token
    localStorage.removeItem('token')
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict"
    
    // Redirigir al login
    window.location.href = '/login'
  }
  
  return response
}

// Función para realizar peticiones GET autenticadas
export const authGet = async (url: string, options: RequestInit = {}): Promise<any> => {
  const response = await authFetch(url, { ...options, method: 'GET' })
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`)
  }
  
  return response.json()
}

// Función para realizar peticiones POST autenticadas
export const authPost = async (url: string, data: any, options: RequestInit = {}): Promise<any> => {
  try {
    // Agregar signal para timeout si se proporciona en las opciones
    const response = await authFetch(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    })
    
    if (!response.ok) {
      // Intentar obtener el cuerpo de la respuesta para ver el mensaje de error
      try {
        const errorBody = await response.text();
        console.error(`authPost - Error ${response.status} en ${url}:`, errorBody);
        
        // Intentar parsear el error como JSON si es posible
        try {
          const jsonError = JSON.parse(errorBody);
          const errorMessage = jsonError.message || jsonError.error || errorBody;
          throw new Error(`Error ${response.status}: ${errorMessage}`);
        } catch (parseError) {
          // Si no se puede parsear como JSON, usar el texto del error
          throw new Error(`Error ${response.status}: ${errorBody || 'Error desconocido'}`);
        }
      } catch (textError) {
        // Si no se puede obtener el texto del error
        throw new Error(`Error ${response.status}: No se pudo obtener detalles del error`);
      }
    }
    
    // Manejar respuestas vacías
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const jsonResponse = await response.json();
        return jsonResponse;
      } catch (jsonError) {
        console.error('Error al parsear respuesta JSON:', jsonError);
        throw new Error('Error al procesar la respuesta del servidor: formato JSON inválido');
      }
    } else {
      // Si no es JSON, devolver el texto
      const textResponse = await response.text();
      return textResponse ? { success: true, message: textResponse } : { success: true };
    }
  } catch (error) {
    // Capturar errores de red y otros errores no manejados
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Error de conexión: No se pudo conectar con el servidor. Verifique su conexión a internet.');
    }
    throw error;
  }
}

// Función para realizar peticiones PUT autenticadas
export const authPut = async (url: string, data: any, options: RequestInit = {}): Promise<any> => {
  const response = await authFetch(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`)
  }
  
  return response.json()
}

// Función para realizar peticiones DELETE autenticadas
export const authDelete = async (url: string, options: RequestInit = {}): Promise<any> => {
  const response = await authFetch(url, { ...options, method: 'DELETE' })
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`)
  }
  
  return response.json()
}
