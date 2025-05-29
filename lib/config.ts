/**
 * Configuración centralizada de endpoints de API
 * Este archivo define todas las rutas de API utilizadas en la aplicación
 * para evitar exponer URLs completas en el código
 */

// Endpoints para autenticación
export const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
};

// Endpoints para usuarios
export const USUARIOS_ENDPOINTS = {
  ALL_USERS: '/api/users',
  SPECIFIC_USER: '/api/users/specific',
  CREATE_USER: '/api/users/create',
  UPDATE_STATUS: '/api/users/update-status',
  UPDATE_IMAGE: '/api/users/update-image',
  UPDATE_INFORMATION: '/api/users/update-information',
};

// Endpoints para almacén
export const ALMACEN_ENDPOINTS = {
  GET_PRODUCTOS: '/api/productos',
  SAVE_PRODUCTO: '/api/productos/save',
  UPDATE_PRODUCTO: '/api/productos/update',
  GET_PRODUCTOS_ACTIVOS: '/api/productos/activos',
  ACTIVAR_PRODUCTO: '/api/productos/activar',
  ENTREGAR_PRODUCTO: '/api/productos/entregar',
  GET_PRESENTACIONES: '/api/productos/presentaciones',
  GET_PRESENTACION_ESPECIFICA: '/api/productos/presentacion/especifica',
  GET_PRESENTACION_BY_CODIGO_LOTE: '/api/presentaciones',
};

// Endpoints para entregas
export const ENTREGAS_ENDPOINTS = {
  GENERATE_ENTREGA: '/api/generate/entrega',
};

// Exportar todos los endpoints como un objeto
export const API_ENDPOINTS = {
  ...AUTH_ENDPOINTS,
  ...USUARIOS_ENDPOINTS,
  ...ALMACEN_ENDPOINTS,
  ...ENTREGAS_ENDPOINTS,
};

export default API_ENDPOINTS;
