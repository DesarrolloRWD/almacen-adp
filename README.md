# AlmacenNaval - Sistema de Gestión de Inventario

## Descripción General
AlmacenNaval es una aplicación web desarrollada con Next.js para la gestión de inventario de insumos médicos. El sistema permite el seguimiento de productos, gestión de lotes, activación de productos y control de entregas, así como la administración de usuarios.

## Características Principales

### Sistema de Autenticación
- **Login de usuarios**: Implementación de un sistema seguro de autenticación basado en tokens JWT.
- **Protección de rutas**: Middleware para verificar la autenticación en rutas protegidas.
- **Manejo de sesiones**: Almacenamiento de tokens en localStorage y cookies para persistencia.

### Gestión de Usuarios
- **Listado de usuarios**: Visualización de todos los usuarios registrados en el sistema.
- **Detalles de usuario**: Diálogo para ver información detallada de cada usuario.
- **Edición de información**: Formulario integrado para modificar datos de usuarios.
- **Gestión de estados**: Activación/desactivación de usuarios.
- **Actualización de imágenes**: Carga y actualización de imágenes de perfil.

### Gestión de Inventario
- **Registro de productos**: Formulario para ingresar nuevos productos al inventario.
- **Activación de lotes**: Sistema para activar cajas de productos para su uso.
- **Entrega de productos**: Registro de entregas de productos activados.
- **Control de inventario**: Seguimiento de productos activos y completados.

## Tecnologías Utilizadas
- **Frontend**: Next.js, React, Tailwind CSS, Shadcn UI
- **Gestión de Estado**: React Context API, React Hooks
- **Formularios**: React Hook Form, Zod
- **API**: REST API con Next.js API Routes

## Estructura de API

### Endpoints de Autenticación
- `POST /api/auth/login`: Autenticación de usuarios y generación de tokens.

### Endpoints de Usuarios
- `GET /api/users`: Obtener todos los usuarios.
- `GET /api/users/specific`: Obtener información de un usuario específico.
- `POST /api/users/update-status`: Actualizar el estado de un usuario.
- `POST /api/users/update-image`: Actualizar la imagen de perfil de un usuario.
- `POST /api/users/update-information`: Actualizar la información general de un usuario.

### Endpoints de Productos
- `POST /api/save/information`: Registrar un nuevo producto.
- `POST /api/save/active/producto`: Activar un lote de producto.
- `GET /api/save/active/entrega/producto`: Registrar la entrega de un producto activo.
- `POST /api/get/productos/activos`: Obtener la lista de productos activos.

## Flujo de Trabajo

### Autenticación
1. El usuario ingresa sus credenciales en la página de login.
2. La aplicación envía las credenciales al endpoint `/api/auth/login`.
3. Si las credenciales son válidas, se genera un token JWT.
4. El token se almacena en localStorage y cookies para mantener la sesión.
5. El usuario es redirigido a la página principal.

### Gestión de Usuarios
1. En la sección de Configuración, se listan todos los usuarios registrados.
2. Al hacer clic en un usuario, se abre un diálogo con información detallada.
3. El administrador puede editar la información, cambiar el estado o actualizar la imagen.
4. Los cambios se envían a los endpoints correspondientes para su procesamiento.

### Activación y Entrega de Productos
1. Se activa un lote de producto mediante el formulario de activación.
2. El producto activado aparece en la lista de productos activos.
3. Se registran entregas parciales del producto hasta completar el lote.
4. Una vez entregado todo el contenido, el producto se marca como completado.

## Configuración del Entorno
El proyecto utiliza variables de entorno para la configuración:

```
NEXT_PUBLIC_API_BASE_URL=http://82.25.97.207:8080/almacen
NEXT_PUBLIC_API_LOGIN_URL=http://82.25.97.207:8080/usuarios-adp/api/login
NEXT_PUBLIC_API_ALL_USERS=http://82.25.97.207:8080/usuarios-adp/api/get/users
NEXT_PUBLIC_API_SPECIFIC_USER=http://82.25.97.207:8080/usuarios-adp/api/get/user
NEXT_PUBLIC_API_UPDATE_STATUS=http://82.25.97.207:8080/usuarios-adp/api/update/status
NEXT_PUBLIC_API_UPDATE_IMAGE=http://82.25.97.207:8080/usuarios-adp/api/update/image
NEXT_PUBLIC_API_UPDATE_INFORMATION=http://82.25.97.207:8080/usuarios-adp/api/update/information
```

## Soluciones Implementadas

### Manejo de CORS
Se implementó un proxy en Next.js para evitar problemas de CORS con la API externa, redirigiendo las solicitudes a través de endpoints locales.

### Formatos de Imagen
Se desarrolló una solución para manejar diferentes formatos de imágenes (base64 y objetos Java serializados) para mostrarlas correctamente en la interfaz.

### Edición de Información de Usuario
Se implementó un formulario integrado en el diálogo de detalles para permitir la edición directa de la información del usuario sin necesidad de navegar a otra página.