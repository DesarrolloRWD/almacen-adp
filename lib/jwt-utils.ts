/**
 * Utilidades para trabajar con tokens JWT
 */

/**
 * Decodifica un token JWT y devuelve el payload
 * @param token Token JWT a decodificar
 * @returns Payload del token decodificado o null si hay error
 */
export function decodeToken(token: string): any {
  try {
    // Verificar que el token tenga el formato correcto
    if (!token || typeof token !== 'string') {
      return null;
    }
    
    // Dividir el token en sus partes (header, payload, signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const base64Url = parts[1];
    if (!base64Url) {
      return null;
    }
    
    // Reemplazar caracteres especiales de base64url a base64 estándar
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Decodificar el payload
    try {
      // Primero intentamos con atob directamente
      const rawPayload = atob(base64);
      const decodedPayload = JSON.parse(rawPayload);
      return decodedPayload;
    } catch (innerError) {
      
      // Si falla, intentamos con el método más complejo
      try {
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decodedPayload = JSON.parse(jsonPayload);
        return decodedPayload;
      } catch (alternativeError) {
        return null;
      }
    }
  } catch (e) {
    return null;
  }
}

/**
 * Verifica si un token JWT es válido
 * @param token Token JWT a verificar
 * @returns true si el token es válido, false en caso contrario
 */
export function verifyToken(token: string): boolean {
  try {
    // Verificar que el token tenga el formato correcto
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // Dividir el token en sus partes (header, payload, signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // Decodificar el payload
    const payload = decodeToken(token);
    if (!payload) {
      return false;
    }
    
    // Verificar si el token ha expirado
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Obtiene el tenant (iss) del token JWT almacenado en localStorage
 * @returns string con el tenant o cadena vacía si no existe
 */
export function getTenantFromToken(): string {
  try {
    // Obtener el token del localStorage
    const token = localStorage.getItem('token')
    
    // Depurar el token obtenido
    
    if (!token) {
      return ''
    }
    
    // Intentar decodificar el token manualmente primero para depuración
    try {
      const tokenParts = token.split('.')
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]))
      }
    } catch (e) {
    }
    
    // Decodificar el token usando la función decodeToken
    const decoded = decodeToken(token)
    
    // Depurar el token decodificado
    
    // Verificar si existe la propiedad iss
    if (decoded && decoded.iss) {
      return decoded.iss
    }
    
    return ''
  } catch (error) {
    return ''
  }
}
