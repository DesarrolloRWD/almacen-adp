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
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Error al decodificar el token JWT", e);
    return null;
  }
}

/**
 * Obtiene el tenant (iss) del token JWT
 * @returns Nombre del tenant o "string" si no se puede obtener
 */
export function getTenantFromToken(): string {
  try {
    // Obtener token del localStorage o cookies
    const token = localStorage.getItem("token") || "";
    if (!token) return "string";
    
    const payload = decodeToken(token);
    if (!payload) return "string";
    
    // Devolver el campo iss (issuer) que contiene el tenant
    return payload.iss || "string";
  } catch (e) {
    console.error("Error al obtener tenant del token", e);
    return "string";
  }
}
