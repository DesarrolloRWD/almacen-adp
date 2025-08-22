"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Loader2, UserPlus, Users, RefreshCw, Upload, Image as ImageIcon, User as UserIcon, Info, Mail, Phone, Calendar, Shield, CheckCircle, XCircle } from "lucide-react"
import { useAuth } from "@/hooks"
import * as api from "@/lib/api"
import LoadingOverlay from "@/components/loading-overlay"

interface User {
  id?: number
  correo: string
  nombre: string
  apdPaterno: string
  apdMaterno: string
  usuario: string
  curp: string
  telefono: string
  rfc: string
  image?: string | null
  roles: { nombre: string }[]
  pswd?: string
  fechaUltimoAcceso?: string
  estatus?: boolean
}

export default function ConfiguracionPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState("usuarios")
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string>("") // Agregado para corregir errores de lint
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [loadingUserDetails, setLoadingUserDetails] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [updatingImage, setUpdatingImage] = useState(false)
  const [updatingInfo, setUpdatingInfo] = useState(false)
  const [newImage, setNewImage] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState<api.UserInformationUpdate>({})
  // Estado para almacenar los roles obtenidos del catálogo
  const [roles, setRoles] = useState<api.Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  
  // Referencias para el input de archivo
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Estado para el formulario de nuevo usuario
  const [newUser, setNewUser] = useState<User>({
    correo: "",
    pswd: "",
    nombre: "",
    apdPaterno: "",
    apdMaterno: "",
    usuario: "",
    curp: "",
    telefono: "",
    rfc: "",
    image: "",
    roles: [] // No usar roles predefinidos, se seleccionarán del catálogo
  })
  
  // Estado para la previsualización de la imagen
  const [imagePreview, setImagePreview] = useState<string>("")

  // Función para cargar los roles disponibles
  const fetchRoles = async () => {
    // Siempre intentar cargar los roles del catálogo
    setLoadingRoles(true)
    setError("") // Limpiar errores anteriores
    try {
      const rolesData = await api.getRoles()
      
      if (Array.isArray(rolesData) && rolesData.length > 0) {
        // Filtrar duplicados por nombre
        const uniqueRoles = rolesData.filter((role, index, self) =>
          index === self.findIndex((r) => r.nombre === role.nombre)
        );
        
        // Se encontraron roles únicos en el catálogo
        setRoles(uniqueRoles)
      } else {
        // No se encontraron roles en el catálogo
        setRoles([]) // No usar roles predefinidos, dejar vacío
        setError("No se pudieron cargar los roles del servidor. Por favor, verifica la conexión e intenta de nuevo.")
      }
    } catch (err) {
      // Error al obtener roles
      setError("Error al cargar los roles disponibles. Por favor, verifica la conexión e intenta de nuevo.")
      setRoles([]) // No usar roles predefinidos, dejar vacío
    } finally {
      setLoadingRoles(false)
    }
  }

  // Cargar usuarios y roles al montar el componente
  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers()
      fetchRoles()
    }
  }, [isAuthenticated])

  // Función para obtener todos los usuarios
  const fetchUsers = async () => {
    setLoadingUsers(true)
    setError("") // Limpiar errores anteriores
    try {
      const data = await api.getAllUsers()
      // ////console.log("Usuarios obtenidos:", data) // Log para depuración
      
      if (Array.isArray(data)) {
        if (data.length === 0) {
          // ////console.log("No se encontraron usuarios")
        }
        setUsers(data)
      } else if (data && typeof data === 'object') {
        // Si la respuesta es un objeto con una propiedad que contiene el array
        const usersArray = Object.values(data).find(val => Array.isArray(val))
        if (usersArray) {
          setUsers(usersArray as User[])
        } else {
          // Si es un solo usuario, convertirlo en array
          setUsers([data as User])
        }
      } else {
        // ////console.log("No se recibieron datos válidos")
        setUsers([])
      }
    } catch (err) {
      // Error al obtener usuarios
      setError("Error al cargar la lista de usuarios. Verifica tu conexión e intenta de nuevo.")
      setUsers([]) // Establecer un array vacío en caso de error
    } finally {
      setLoadingUsers(false)
    }
  }

  // Función para manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Función para manejar la selección de rol
  const handleRoleChange = (value: string) => {
    setNewUser(prev => ({
      ...prev,
      roles: [{ nombre: value }]
    }))
  }
  
  // Función para manejar la carga de imágenes
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError("Por favor selecciona un archivo de imagen válido")
      return
    }
    
    // Convertir a base64
    const reader = new FileReader()
    reader.onload = () => {
      const base64String = reader.result as string
      // Guardar en el estado
      setNewUser(prev => ({
        ...prev,
        image: base64String
      }))
      // Mostrar previsualización
      setImagePreview(base64String)
    }
    reader.readAsDataURL(file)
  }
  
  // Función para abrir el selector de archivos
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }
  
  // Estado para almacenar el nombre de usuario que se está cargando actualmente
  const [loadingUsername, setLoadingUsername] = useState<string | null>(null)
  
  // Función para obtener los detalles de un usuario específico
  const fetchUserDetails = async (username: string) => {
    // Guardar el nombre de usuario que estamos cargando
    setLoadingUsername(username)
    setLoadingUserDetails(true)
    try {
      const userData = await api.getSpecificUser(username)
      // ////console.log("Detalles del usuario:", userData)
      setSelectedUser(userData)
      setIsUserDialogOpen(true)
    } catch (err) {
      // Error al obtener detalles del usuario
      setError("Error al obtener detalles del usuario. Intenta de nuevo.")
    } finally {
      setLoadingUserDetails(false)
      setLoadingUsername(null) // Limpiar el nombre de usuario en carga
    }
  }
  
  // Función para actualizar el estado de un usuario
  const updateUserStatus = async (username: string, newStatus: boolean) => {
    if (!username) return
    
    setUpdatingStatus(true)
    try {
      await api.updateUserStatus(username, newStatus)
      // Actualizar el estado del usuario seleccionado
      if (selectedUser && selectedUser.usuario === username) {
        setSelectedUser({
          ...selectedUser,
          estatus: newStatus
        })
      }
      // Actualizar la lista de usuarios
      setUsers(users.map(user => {
        if (user.usuario === username) {
          return { ...user, estatus: newStatus }
        }
        return user
      }))
      setSuccess(`Estado del usuario actualizado correctamente`)
    } catch (err) {
      // Error al actualizar estado del usuario
      setError("Error al actualizar estado del usuario. Intenta de nuevo.")
    } finally {
      setUpdatingStatus(false)
    }
  }
  
  // Función para manejar la selección de una nueva imagen
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64Image = e.target?.result as string
      setNewImage(base64Image)
    }
    reader.readAsDataURL(file)
  }
  
  // Función para actualizar la imagen de un usuario
  const updateUserImage = async (username: string, imageBase64: string) => {
    if (!username || !imageBase64) return
    
    setUpdatingImage(true)
    try {
      await api.updateUserImage(username, imageBase64)
      // Actualizar la imagen del usuario seleccionado
      if (selectedUser && selectedUser.usuario === username) {
        setSelectedUser({
          ...selectedUser,
          image: imageBase64
        })
      }
      // Actualizar la lista de usuarios
      setUsers(users.map(user => {
        if (user.usuario === username) {
          return { ...user, image: imageBase64 }
        }
        return user
      }))
      setNewImage(null)
      setSuccess(`Imagen del usuario actualizada correctamente`)
    } catch (err) {
      // Error al actualizar imagen del usuario
      setError("Error al actualizar imagen del usuario. Intenta de nuevo.")
    } finally {
      setUpdatingImage(false)
    }
  }

  // Función para manejar cambios en el formulario de edición
  const handleEditFormChange = (field: keyof api.UserInformationUpdate, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Función para iniciar el modo de edición
  const startEditMode = () => {
    if (!selectedUser) return
    
    // Inicializar el formulario con los datos actuales del usuario
    setEditForm({
      correo: selectedUser.correo,
      nombre: selectedUser.nombre,
      apdPaterno: selectedUser.apdPaterno,
      apdMaterno: selectedUser.apdMaterno,
      telefono: selectedUser.telefono,
      curp: selectedUser.curp,
      rfc: selectedUser.rfc
    })
    setIsEditMode(true)
  }

  // Función para cancelar la edición
  const cancelEdit = () => {
    setIsEditMode(false)
    setEditForm({})
  }

  // Función para actualizar toda la información del usuario
  const updateUserInformation = async (username: string, userInfo: api.UserInformationUpdate) => {
    if (!username) return
    
    setUpdatingInfo(true)
    try {
      await api.updateUserInformation(username, userInfo)
      // Actualizar el usuario seleccionado
      if (selectedUser && selectedUser.usuario === username) {
        setSelectedUser({
          ...selectedUser,
          ...userInfo
        })
      }
      // Actualizar la lista de usuarios
      setUsers(users.map(user => {
        if (user.usuario === username) {
          return { ...user, ...userInfo }
        }
        return user
      }))
      setSuccess(`Información del usuario actualizada correctamente`)
      setIsEditMode(false) // Salir del modo de edición después de guardar
      setEditForm({}) // Limpiar el formulario
    } catch (err) {
      // Error al actualizar información del usuario
      setError("Error al actualizar información del usuario. Intenta de nuevo.")
    } finally {
      setUpdatingInfo(false)
    }
  }
  
  // Función para crear un nuevo usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validar campos requeridos
      if (!newUser.usuario || !newUser.pswd || !newUser.nombre || !newUser.correo) {
        setError("Por favor completa los campos obligatorios")
        setIsLoading(false)
        return
      }
      
      // Validar que se haya seleccionado al menos un rol
      if (!newUser.roles || newUser.roles.length === 0) {
        setError("Por favor selecciona al menos un rol para el usuario")
        setIsLoading(false)
        return
      }

      await api.createUser(newUser)
      setSuccess("Usuario creado exitosamente")
      
      // Limpiar formulario
      setNewUser({
        correo: "",
        pswd: "",
        nombre: "",
        apdPaterno: "",
        apdMaterno: "",
        usuario: "",
        curp: "",
        telefono: "",
        rfc: "",
        image: "",
        roles: [] // Sin roles predefinidos
      })
      
      // Recargar lista de usuarios
      fetchUsers()
    } catch (err) {
      // Error al crear usuario
      setError("Error al crear el usuario. Intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Configuración</h1>
      
      <Tabs defaultValue="usuarios" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Gestión de Usuarios</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="usuarios">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulario para crear nuevo usuario */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  <span>Crear Nuevo Usuario</span>
                </CardTitle>
                <CardDescription>
                  Completa el formulario para crear un nuevo usuario en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="usuario">Usuario <span className="text-red-500">*</span></Label>
                      <Input 
                        id="usuario" 
                        name="usuario" 
                        value={newUser.usuario} 
                        onChange={handleInputChange} 
                        placeholder="Usuario para iniciar sesión"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pswd">Contraseña <span className="text-red-500">*</span></Label>
                      <Input 
                        id="pswd" 
                        name="pswd" 
                        type="password" 
                        value={newUser.pswd} 
                        onChange={handleInputChange} 
                        placeholder="Contraseña"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
                      <Input 
                        id="nombre" 
                        name="nombre" 
                        value={newUser.nombre} 
                        onChange={handleInputChange} 
                        placeholder="Nombre(s)"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="apdPaterno">Apellido Paterno</Label>
                      <Input 
                        id="apdPaterno" 
                        name="apdPaterno" 
                        value={newUser.apdPaterno} 
                        onChange={handleInputChange} 
                        placeholder="Apellido paterno"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="apdMaterno">Apellido Materno</Label>
                      <Input 
                        id="apdMaterno" 
                        name="apdMaterno" 
                        value={newUser.apdMaterno} 
                        onChange={handleInputChange} 
                        placeholder="Apellido materno"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="correo">Correo Electrónico <span className="text-red-500">*</span></Label>
                      <Input 
                        id="correo" 
                        name="correo" 
                        type="email" 
                        value={newUser.correo} 
                        onChange={handleInputChange} 
                        placeholder="correo@ejemplo.com"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="telefono">Teléfono</Label>
                      <Input 
                        id="telefono" 
                        name="telefono" 
                        value={newUser.telefono} 
                        onChange={handleInputChange} 
                        placeholder="Número de teléfono"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="curp">CURP</Label>
                      <Input 
                        id="curp" 
                        name="curp" 
                        value={newUser.curp} 
                        onChange={handleInputChange} 
                        placeholder="CURP"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="rfc">RFC</Label>
                      <Input 
                        id="rfc" 
                        name="rfc" 
                        value={newUser.rfc} 
                        onChange={handleInputChange} 
                        placeholder="RFC"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Rol <span className="text-red-500">*</span></Label>
                      <Select 
                        value={newUser.roles?.[0]?.nombre || ''}
                        onValueChange={(value) => 
                          setNewUser({...newUser, roles: [{ nombre: value }]})
                        }
                        disabled={loadingRoles}
                      >
                        <SelectTrigger>
                          {loadingRoles ? (
                            <div className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              <span>Cargando roles...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Seleccionar rol" />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {roles.length > 0 ? (
                            roles.map((role) => (
                                <SelectItem key={role.nombre} value={role.nombre}>
                                  {role.nombre === "ROLE_ADMIN" ? "Administrador" : 
                                   role.nombre === "ROLE_USER" ? "Usuario" : 
                                   role.nombre}
                                </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="ROLE_USER" disabled>
                              No hay roles disponibles
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Imagen de perfil</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={triggerFileInput}
                          className="flex items-center gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          <span>Subir imagen</span>
                        </Button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        
                        {imagePreview ? (
                          <div className="relative h-20 w-20 overflow-hidden rounded-md border">
                            <img 
                              src={imagePreview} 
                              alt="Vista previa" 
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-md border bg-muted">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  {success && <p className="text-sm text-green-500">{success}</p>}
                  
                  <Button type="submit" className="w-full bg-naval-600 hover:bg-naval-700" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Creando usuario...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        <span>Crear Usuario</span>
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Lista de usuarios */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>Usuarios Registrados</span>
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchUsers} 
                    disabled={loadingUsers}
                    className="flex items-center gap-1"
                  >
                    {loadingUsers ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    <span>Actualizar</span>
                  </Button>
                </div>
                <CardDescription>
                  Lista de todos los usuarios registrados en el sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 text-sm">
                      {error}
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={fetchUsers} 
                        className="ml-2 text-red-700 underline"
                      >
                        Reintentar
                      </Button>
                    </div>
                  )}
                  

                  
                  {loadingUsers ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-gray-50 rounded-md">
                      <Loader2 className="h-8 w-8 animate-spin text-naval-600" />
                      <p className="text-sm text-gray-500">Cargando usuarios...</p>
                    </div>
                  ) : users.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {users.map((user, index) => (
                        <Card 
                          key={user.id || index} 
                          className={`overflow-hidden cursor-pointer transition-all hover:border-naval-300 hover:shadow-md ${loadingUsername === user.usuario ? 'opacity-70' : ''}`}
                          onClick={() => fetchUserDetails(user.usuario)}
                        >
                          <div className="p-4 flex flex-col space-y-3 relative">
                            {loadingUsername === user.usuario && (
                              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                                <Loader2 className="h-6 w-6 animate-spin text-naval-600" />
                              </div>
                            )}
                            <div className="flex justify-center">
                              <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-naval-100">
                                {user.image && !user.image.startsWith('[B@') ? (
                                  <img 
                                    src={user.image.startsWith('data:') ? user.image : `data:image/jpeg;base64,${user.image}`} 
                                    alt={user.nombre} 
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-naval-100 text-naval-700">
                                    <UserIcon className="h-6 w-6" />
                                  </div>
                                )}
                                {user.estatus !== undefined && (
                                  <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border border-white ${user.estatus ? 'bg-green-500' : 'bg-red-500'}`} />
                                )}
                              </div>
                            </div>
                            <div className="border-t pt-2">
                              <p className="text-sm text-gray-700 font-medium">
                                {user.nombre || "--"} {user.apdPaterno || ""} {user.apdMaterno || ""}
                              </p>
                              <p className="text-xs text-gray-500">
                                {user.correo || "Sin correo"}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-gray-50 rounded-md">
                      <Users className="h-12 w-12 text-gray-300" />
                      <div className="text-center space-y-1">
                        <p className="text-gray-500 font-medium">No hay usuarios registrados</p>
                        <p className="text-gray-400 text-sm">Los usuarios que crees aparecerán aquí</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchUsers} 
                        className="mt-2"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        <span>Actualizar lista</span>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      {/* Diálogo para mostrar detalles del usuario */}
      <Dialog 
        open={isUserDialogOpen} 
        onOpenChange={(open) => {
          setIsUserDialogOpen(open);
          if (!open) {
            // Resetear el modo de edición al cerrar el diálogo
            setIsEditMode(false);
            setEditForm({});
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-2">
            <DialogTitle>Detalles del Usuario</DialogTitle>
            <DialogDescription className="text-xs">
              Información detallada del usuario seleccionado.
            </DialogDescription>
          </DialogHeader>
          {loadingUserDetails ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-naval-600" />
            </div>
          ) : selectedUser ? (
            <div className="space-y-3">
              <div className="flex flex-col items-center space-y-2 pb-2 border-b">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-naval-100">
                  {newImage ? (
                    <img
                      src={newImage}
                      alt={selectedUser.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : selectedUser.image && !selectedUser.image.startsWith('[B@') ? (
                    <img
                      src={selectedUser.image.startsWith('data:') ? selectedUser.image : `data:image/jpeg;base64,${selectedUser.image}`}
                      alt={selectedUser.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-naval-100 text-naval-700">
                      <UserIcon className="h-8 w-8" />
                    </div>
                  )}
                  {/* Botón para cambiar imagen */}
                  <div className="absolute bottom-0 right-0">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="h-6 w-6 rounded-full border border-white bg-white shadow-sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={updatingImage}
                    >
                      {updatingImage ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ImageIcon className="h-3 w-3" />
                      )}
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </div>
                </div>
                <h3 className="text-base font-semibold">
                  {selectedUser.nombre} {selectedUser.apdPaterno}{" "}
                  {selectedUser.apdMaterno}
                </h3>
                <div className="flex items-center space-x-2">
                  {/* Estado del usuario con botón para cambiar */}
                  <Button 
                    type="button" 
                    size="sm" 
                    variant={selectedUser?.estatus ? "default" : "outline"}
                    className={`h-6 rounded-full px-2 ${selectedUser?.estatus ? 'bg-green-500 hover:bg-green-600' : 'border-red-300 text-red-700 hover:bg-red-50'}`}
                    onClick={() => selectedUser && updateUserStatus(selectedUser.usuario, !selectedUser.estatus)}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : selectedUser?.estatus ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    <span className="text-xs">{selectedUser?.estatus ? 'Activo' : 'Inactivo'}</span>
                  </Button>
                  {selectedUser?.roles && selectedUser.roles.length > 0 && (
                    <span className="inline-flex items-center rounded-full bg-naval-100 px-2 py-0.5 text-xs font-medium text-naval-700">
                      {selectedUser.roles.map(role => role.nombre).join(", ")}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Botón para actualizar imagen si hay una nueva seleccionada */}
              {newImage && selectedUser && (
                <div className="flex justify-center">
                  <Button 
                    type="button" 
                    size="sm" 
                    variant="default" 
                    onClick={() => updateUserImage(selectedUser.usuario, newImage)}
                    disabled={updatingImage}
                    className="w-full"
                  >
                    {updatingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span>Actualizando...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        <span>Guardar imagen</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Botón para alternar entre modo visualización y edición */}
              {!isEditMode ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={startEditMode}
                  className="w-full mb-2"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Editar información
                </Button>
              ) : (
                <div className="flex space-x-2 mb-2">
                  <Button 
                    type="button" 
                    variant="default" 
                    onClick={() => selectedUser && updateUserInformation(selectedUser.usuario, editForm)}
                    disabled={updatingInfo}
                    className="flex-1"
                    size="sm"
                  >
                    {updatingInfo ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        <span className="text-xs">Guardando...</span>
                      </>
                    ) : (
                      <span className="text-xs">Guardar cambios</span>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={cancelEdit}
                    disabled={updatingInfo}
                    className="flex-1"
                    size="sm"
                  >
                    <span className="text-xs">Cancelar</span>
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                <div className="flex items-start space-x-2">
                  <UserIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">Usuario</p>
                    <p className="text-xs text-gray-500">{selectedUser?.usuario || "No disponible"}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">Correo electrónico</p>
                    {isEditMode ? (
                      <input 
                        type="email" 
                        value={editForm.correo || ''}
                        onChange={(e) => handleEditFormChange('correo', e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-1 text-xs"
                      />
                    ) : (
                      <p className="text-xs text-gray-500">{selectedUser?.correo || "No disponible"}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <UserIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">Nombre</p>
                    {isEditMode ? (
                      <input 
                        type="text" 
                        value={editForm.nombre || ''}
                        onChange={(e) => handleEditFormChange('nombre', e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-1 text-xs"
                      />
                    ) : (
                      <p className="text-xs text-gray-500">{selectedUser?.nombre || "No disponible"}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <UserIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">Apellido Paterno</p>
                    {isEditMode ? (
                      <input 
                        type="text" 
                        value={editForm.apdPaterno || ''}
                        onChange={(e) => handleEditFormChange('apdPaterno', e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-1 text-xs"
                      />
                    ) : (
                      <p className="text-xs text-gray-500">{selectedUser?.apdPaterno || "No disponible"}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <UserIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">Apellido Materno</p>
                    {isEditMode ? (
                      <input 
                        type="text" 
                        value={editForm.apdMaterno || ''}
                        onChange={(e) => handleEditFormChange('apdMaterno', e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-1 text-xs"
                      />
                    ) : (
                      <p className="text-xs text-gray-500">{selectedUser?.apdMaterno || "No disponible"}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">Teléfono</p>
                    {isEditMode ? (
                      <input 
                        type="tel" 
                        value={editForm.telefono || ''}
                        onChange={(e) => handleEditFormChange('telefono', e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-1 text-xs"
                      />
                    ) : (
                      <p className="text-xs text-gray-500">{selectedUser?.telefono || "No disponible"}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">Último acceso</p>
                    <p className="text-xs text-gray-500">
                      {selectedUser?.fechaUltimoAcceso ? (
                        new Date(selectedUser.fechaUltimoAcceso).toLocaleString('es-MX', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      ) : "No disponible"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">CURP</p>
                    {isEditMode ? (
                      <input 
                        type="text" 
                        value={editForm.curp || ''}
                        onChange={(e) => handleEditFormChange('curp', e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-1 text-xs"
                      />
                    ) : (
                      <p className="text-xs text-gray-500">{selectedUser?.curp || "No disponible"}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Shield className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">RFC</p>
                    {isEditMode ? (
                      <input 
                        type="text" 
                        value={editForm.rfc || ''}
                        onChange={(e) => handleEditFormChange('rfc', e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-1 text-xs"
                      />
                    ) : (
                      <p className="text-xs text-gray-500">{selectedUser?.rfc || "No disponible"}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              No se encontró información del usuario
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
