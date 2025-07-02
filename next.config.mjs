/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuración de proxy para evitar problemas de CORS durante desarrollo
  async rewrites() {
    return [
      // Proxy para autenticación
      {
        source: '/api/auth/login',
        destination: `${process.env.NEXT_PUBLIC_AUTH_API_URL}/login`,
      },
      
      // Proxy para usuarios
      {
        source: '/users',
        destination: `${process.env.NEXT_PUBLIC_USUARIOS_API_URL}/get/all-users`,
      },
      {
        source: '/users/specific',
        destination: `${process.env.NEXT_PUBLIC_USUARIOS_API_URL}/specific/user`,
      },
      {
        source: '/users/create',
        destination: `${process.env.NEXT_PUBLIC_USUARIOS_API_URL}/save/information`,
      },
      {
        source: '/users/update-status',
        destination: `${process.env.NEXT_PUBLIC_USUARIOS_API_URL}/update/status`,
      },
      {
        source: '/users/update-image',
        destination: `${process.env.NEXT_PUBLIC_USUARIOS_API_URL}/update/image`,
      },
      {
        source: '/users/update-information',
        destination: `${process.env.NEXT_PUBLIC_USUARIOS_API_URL}/update/information`,
      },
      
      // Proxy para almacén
      {
        source: '/productos/presentaciones',
        destination: `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/get/all/presentaciones`,
      },
      {
        source: '/productos/presentacion/especifica',
        destination: `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/get/specific/presentacion`,
      },
      {
        source: '/presentaciones',
        destination: `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/get/presentation/by/codigo/lote`,
      },
      {
        source: '/productos',
        destination: `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/get/products`,
      },
      {
        source: '/productos/save',
        destination: `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/save/product`,
      },
      {
        source: '/productos/update',
        destination: `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/update/product`,
      },
      {
        source: '/productos/activos',
        destination: `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/get/productos/activos`,
      },
      {
        source: '/productos/activar',
        destination: `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/save/active/producto`,
      },
      {
        source: '/productos/entregar',
        destination: `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/save/active/entrega/producto`,
      },
      
      // Proxy para entregas
      {
        source: '/api/generate/entrega',
        destination: `${process.env.NEXT_PUBLIC_ENTREGAS_API_URL}/generate/entrega`,
      },

      // Proxy para historial
      {
        source: '/api/get/historial',
        destination: `${process.env.NEXT_PUBLIC_HISTORIAL_API_URL}/get/historial`,
      },
      
      // Proxy para obtener productos
      {
        source: '/api/get/productos',
        destination: `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/get/products`,
      },
    ];
  },
  
  // Configuración adicional para evitar problemas de CORS
  async headers() {
    return [
      {
        // source: '/api/:path*',
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
}

export default nextConfig
