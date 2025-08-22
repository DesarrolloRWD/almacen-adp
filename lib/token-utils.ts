import jwt from 'jsonwebtoken';

/**
 * Obtiene el tenant del almacén general desde las variables de entorno
 * @returns El tenant del almacén general
 * @throws Error si la variable de entorno no está configurada
 */
function getTenant(): string {
  const tenant = process.env.NEXT_PUBLIC_TENANT;
  if (!tenant) {
    throw new Error('Variable de entorno NEXT_PUBLIC_TENANT no configurada');
  }
  return tenant;
}

/**
 * Obtiene la clave secreta para firmar tokens desde las variables de entorno
 * @returns La clave secreta
 * @throws Error si la variable de entorno no está configurada
 */
function getSecretKey(): string {
  const secretKey = process.env.NEXT_PUBLIC_TOKEN;
  if (!secretKey) {
    throw new Error('Variable de entorno NEXT_PUBLIC_TOKEN no configurada');
  }
  return secretKey;
}

/**
 * Modifica un token JWT para usar el tenant del almacén general
 * @param originalToken Token JWT original
 * @returns Nuevo token JWT con el tenant modificado
 */
export function modifyTokenWithAlmacenGeneralTenant(originalToken: string): string {
  try {
    // Decodificar el token sin verificar la firma
    const decodedToken = jwt.decode(originalToken);
    
    if (!decodedToken || typeof decodedToken !== 'object') {
      throw new Error('Token inválido');
    }
    
    // Modificar el payload para usar el tenant del almacén general
    const modifiedPayload = {
      ...decodedToken,
      iss: getTenant(),
    };
    
    // Eliminar propiedades de tiempo para que sean generadas correctamente
    delete modifiedPayload.exp;
    delete modifiedPayload.iat;
    delete modifiedPayload.nbf;
    
    // Obtener la hora actual en segundos (formato UNIX timestamp)
    const now = Math.floor(Date.now() / 1000);
    
    // Firmar el nuevo token con nuestra clave secreta
    return jwt.sign(
      {
        ...modifiedPayload,
        // Agregar nbf (not before) como número
        nbf: now
      }, 
      getSecretKey(), 
      { 
        algorithm: 'HS256',
        expiresIn: '24h' // El token durará 24 horas
      }
    );
  } catch (error) {
    console.error('Error al modificar el token:', error);
    throw error;
  }
}

/**
 * Obtiene un token con el tenant del almacén general
 * @param userToken Token del usuario actual (opcional)
 * @returns Token con el tenant del almacén general
 */
export function getAlmacenGeneralToken(userToken?: string): string {
  try {
    // Si se proporciona un token de usuario, modificarlo
    if (userToken) {
      return modifyTokenWithAlmacenGeneralTenant(userToken);
    }
    
    // Si no hay token de usuario, crear uno básico
    // Obtener la hora actual en segundos (formato UNIX timestamp)
    const now = Math.floor(Date.now() / 1000);
    
    const basicPayload = {
      sub: 'sistema',
      authorities: '[{"authority":"ROLE_ADMIN"}]',
      isAdmin: true,
      iss: getTenant(),
      status: true,
      nbf: now  // Agregar nbf (not before) como número
    };
    
    return jwt.sign(basicPayload, getSecretKey(), { 
      algorithm: 'HS256',
      expiresIn: '24h'
    });
  } catch (error) {
    console.error('Error al generar token del almacén general:', error);
    throw error;
  }
}
