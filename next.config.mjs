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
        source: '/api/users',
        destination: `${process.env.NEXT_PUBLIC_USUARIOS_API_URL}/api/get/all-users`,
      },
      {
        source: '/api/users/specific',
        destination: `${process.env.NEXT_PUBLIC_USUARIOS_API_URL}/api/specific/user`,
      },
      {
        source: '/api/users/create',
        destination: `${process.env.NEXT_PUBLIC_USUARIOS_API_URL}/api/save/information`,
      },
      {
        source: '/api/users/update-status',
        destination: `${process.env.NEXT_PUBLIC_USUARIOS_API_URL}/api/update/status`,
      },
      {
        source: '/api/users/update-image',
        destination: `${process.env.NEXT_PUBLIC_USUARIOS_API_URL}/api/update/image`,
      },
      {
        source: '/api/users/update-information',
        destination: `${process.env.NEXT_PUBLIC_USUARIOS_API_URL}/api/update/information`,
      },
      
      // Proxy para almacén
      {
        source: '/api/productos',
        destination: `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/api/get/products`,
      },
      {
        source: '/api/productos/save',
        destination: `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/api/save/product`,
      },
      {
        source: '/api/productos/update',
        destination: `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/api/update/product`,
      },
      {
        source: '/api/productos/activos',
        destination: `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/api/get/productos/activos`,
      },
      {
        source: '/api/productos/activar',
        destination: `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/api/save/active/producto`,
      },
      {
        source: '/api/productos/entregar',
        destination: `${process.env.NEXT_PUBLIC_ALMACEN_API_URL}/api/save/active/entrega/producto`,
      },
    ];
  },
  
  // Configuración adicional para evitar problemas de CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
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
