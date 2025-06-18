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
  ALL_USERS: '/users',
  SPECIFIC_USER: '/users/specific',
  CREATE_USER: '/users/create',
  UPDATE_STATUS: '/users/update-status',
  UPDATE_IMAGE: '/users/update-image',
  UPDATE_INFORMATION: '/users/update-information',
};

// Endpoints para almacén
export const ALMACEN_ENDPOINTS = {
  GET_PRODUCTOS: '/productos',
  SAVE_PRODUCTO: '/productos/save',
  UPDATE_PRODUCTO: '/productos/update',
  GET_PRODUCTOS_ACTIVOS: '/productos/activos',
  ACTIVAR_PRODUCTO: '/productos/activar',
  ENTREGAR_PRODUCTO: '/productos/entregar',
  GET_PRESENTACIONES: '/productos/presentaciones',
  GET_PRESENTACION_ESPECIFICA: '/productos/presentacion/especifica',
  GET_PRESENTACION_BY_CODIGO_LOTE: '/presentaciones',
};

// Endpoints para entregas
export const ENTREGAS_ENDPOINTS = {
  GENERATE_ENTREGA: '/api/generate/entrega',
};

// Endpoints para historial
export const HISTORIAL_ENDPOINTS = {
  GET_HISTORIAL: '/get/historial',
};

// Exportar todos los endpoints como un objeto
export const API_ENDPOINTS = {
  ...AUTH_ENDPOINTS,
  ...USUARIOS_ENDPOINTS,
  ...ALMACEN_ENDPOINTS,
  ...ENTREGAS_ENDPOINTS,
  ...HISTORIAL_ENDPOINTS,
};

export default API_ENDPOINTS;
