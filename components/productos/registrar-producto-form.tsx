"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks"
import { api } from "@/lib/api"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon, Stethoscope, PackageOpen, PlusCircle, Trash2, QrCode, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast as sonnerToast } from "sonner"
import QrScanner from "./qr-scanner"

// Esquema para las presentaciones
const presentacionSchema = z.object({
  codigo: z.string().min(1, { message: "El código es requerido" }),
  tipoPresentacion: z.string().min(1, { message: "El tipo de presentación es requerido" }),
  descripcionPresentacion: z.string().min(1, { message: "La descripción es requerida" }),
  cantidad: z.coerce.number().min(1, { message: "Debe ser al menos 1" }),
  equivalenciaEnBase: z.coerce.number().min(1, { message: "Debe ser al menos 1" })
});

// Esquema de validación principal
const formSchema = z.object({
  codigo: z.string().min(3, {
    message: "El código debe tener al menos 3 caracteres.",
  }),
  descripcion: z.string().min(5, {
    message: "La descripción debe tener al menos 5 caracteres.",
  }),
  marca: z.string().min(2, {
    message: "La marca debe tener al menos 2 caracteres.",
  }),
  unidadBase: z.string().min(1, {
    message: "La unidad base es requerida.",
  }),
  division: z.string().min(1, {
    message: "La división es requerida.",
  }),
  linea: z.string().min(1, {
    message: "La línea es requerida.",
  }),
  sublinea: z.string().min(1, {
    message: "La sublínea es requerida.",
  }),
  lote: z.string().min(1, {
    message: "El lote es requerido.",
  }),
  fechaExpiracion: z.date({
    required_error: "La fecha de expiración es requerida.",
  }),
  minimos: z.coerce.number().min(0, {
    message: "El valor mínimo debe ser 0 o mayor.",
  }),
  maximos: z.coerce.number().min(0, {
    message: "El valor máximo debe ser 0 o mayor.",
  }),
  creadoPor: z.string().min(1, {
    message: "El creador es requerido.",
  }),
  cantidadNeta: z.coerce.number().min(0, {
    message: "La cantidad neta debe ser 0 o mayor.",
  }),
  presentaciones: z.array(presentacionSchema).min(1, {
    message: "Debe agregar al menos una presentación.",
  }),
})

// Componente de animación para mostrar cuando el producto se registra exitosamente
const SuccessAnimation = ({ message, onComplete }: { message: string, onComplete: () => void }) => {
  useEffect(() => {
    // Después de 2.5 segundos, ejecutar onComplete
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg p-8 flex flex-col items-center max-w-md mx-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", damping: 15 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-4 text-green-500"
        >
          <CheckCircle size={80} strokeWidth={1.5} />
        </motion.div>
        
        <motion.h2
          className="text-2xl font-bold text-naval-700 mb-2 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          ¡Producto Registrado!
        </motion.h2>
        
        <motion.p
          className="text-naval-600 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {message}
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export default function RegistrarProductoForm() {
  const router = useRouter()
  const { user } = useAuth() // Obtener el usuario del contexto de autenticación
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [cantidadRestante, setCantidadRestante] = useState(0)
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const formRef = useRef<HTMLDivElement>(null)
  
  // Opciones predefinidas para Unidad Base
  const unidadesBaseOptions = ["PIEZA", "CAJA", "KIT"]

  // Obtener información del usuario logueado usando el endpoint de usuarios
  useEffect(() => {
    const obtenerUsuarioActual = async () => {
      setIsLoadingUsers(true);
      try {
        // Obtener el token del localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          //console.log('No hay token disponible');
          setIsLoadingUsers(false);
          return;
        }
        
        // Obtener el nombre de usuario del localStorage (si existe)
        const usuarioGuardado = localStorage.getItem('usuario');
        
        // Obtener todos los usuarios usando el endpoint
        const usuarios = await api.getAllUsers();
        
        if (usuarios && usuarios.length > 0) {
          // Buscar el usuario actual basado en el token o en localStorage
          let usuarioActual = null;
          
          // Si tenemos el nombre de usuario guardado, buscar por ese nombre
          if (usuarioGuardado) {
            usuarioActual = usuarios.find(u => u.usuario === usuarioGuardado);
          }
          
          // Si no encontramos el usuario, intentar decodificar el token
          if (!usuarioActual && token) {
            try {
              // Decodificar el token JWT para obtener el nombre de usuario
              const base64Url = token.split('.')[1];
              if (base64Url) {
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
                
                const payload = JSON.parse(jsonPayload);
                const username = payload.sub || payload.usuario;
                
                if (username) {
                  usuarioActual = usuarios.find(u => u.usuario === username);
                }
              }
            } catch (e) {
              // Error al decodificar el token JWT
            }
          }
          
          // Si encontramos el usuario, usar solo su nombre de usuario (usuario)
          if (usuarioActual) {
            setNombreUsuario(usuarioActual.usuario);
            // Usuario actual encontrado
          } else {
            // Si no encontramos el usuario, usar el primer usuario de la lista como fallback
            const primerUsuario = usuarios[0];
            setNombreUsuario(primerUsuario.usuario);
            // Usando primer usuario como fallback
          }
        }
      } catch (error) {
        console.error('Error al obtener usuarios:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    obtenerUsuarioActual();
  }, [])

  // Inicializar formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: "",
      descripcion: "",
      marca: "",
      unidadBase: "",
      division: "",
      linea: "",
      sublinea: "",
      lote: "",
      fechaExpiracion: new Date(),
      minimos: 0,
      maximos: 0,
      creadoPor: "",
      cantidadNeta: 0,
      presentaciones: [
        {
          codigo: "",
          tipoPresentacion: "",
          descripcionPresentacion: "",
          cantidad: 1,
          equivalenciaEnBase: 1
        }
      ],
    },
  })

  // Actualizar el campo "Creado Por" con el nombre del usuario cuando el formulario esté listo
  useEffect(() => {
    if (nombreUsuario) {
      form.setValue('creadoPor', nombreUsuario);
    }
  }, [nombreUsuario, form]);

  // Calcular la cantidad restante por asignar en presentaciones
  const calcularCantidadRestante = () => {
    const cantidadNeta = form.watch('cantidadNeta') || 0;
    const presentaciones = form.watch('presentaciones') || [];
    
    const cantidadAsignada = presentaciones.reduce((total, presentacion) => {
      return total + (Number(presentacion.cantidad) || 0);
    }, 0);
    
    return cantidadNeta - cantidadAsignada;
  };

  // Actualizar la cantidad restante cuando cambian los valores relevantes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name?.includes('cantidadNeta') || name?.includes('presentaciones')) {
        setCantidadRestante(calcularCantidadRestante());
      }
    });
    
    // Calcular inicial
    setCantidadRestante(calcularCantidadRestante());
    
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Manejar envío del formulario
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      // Formatear los valores del formulario según la estructura requerida por la API
      const formattedValues = {
        codigo: values.codigo,
        descripcion: values.descripcion,
        marca: values.marca,
        unidadBase: values.unidadBase,
        division: values.division,
        linea: values.linea,
        sublinea: values.sublinea,
        lote: values.lote,
        // Usar exactamente el formato que funciona en Postman
        fechaExpiracion: `${values.fechaExpiracion.getFullYear()}-${String(values.fechaExpiracion.getMonth() + 1).padStart(2, '0')}-${String(values.fechaExpiracion.getDate()).padStart(2, '0')}T00:00:00.000Z`,
        minimos: Number(values.minimos),
        maximos: Number(values.maximos),
        creadoPor: values.creadoPor,
        cantidadNeta: Number(values.cantidadNeta),
        presentaciones: values.presentaciones.map(p => ({
          codigo: p.codigo,
          tipoPresentacion: p.tipoPresentacion,
          descripcionPresentacion: p.descripcionPresentacion,
          cantidad: Number(p.cantidad),
          equivalenciaEnBase: Number(p.equivalenciaEnBase)
        }))
      }
      
      // Ya no necesitamos obtener la URL del endpoint desde las variables de entorno
      // Usamos el endpoint local configurado en next.config.mjs
      
      // Obtener el token de autenticación del localStorage
      const token = localStorage.getItem('token')
      
      // Usar el proxy local para evitar problemas de CORS
      const response = await fetch(`/api/save/product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(formattedValues),
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        
        // Intentar parsear el error como JSON
        let parsedError;
        try {
          parsedError = JSON.parse(errorData);
        } catch (e) {
          // Si no es JSON, usar el texto tal cual
          parsedError = { error: errorData };
        }
        
        // Verificar si es un error de token expirado
        if (response.status === 401 && 
            (parsedError.error === "Token expirado" || 
             (parsedError.details && parsedError.details.includes("JWT expired")))) {
          
          // Mostrar mensaje específico para token expirado
          toast({
            title: "Sesión expirada",
            description: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
            variant: "destructive",
          })
          
          // Redirigir a la página de inicio de sesión
          // Si tienes un componente de redirección, úsalo aquí
          // Por ejemplo: router.push('/login')
          
          // Alternativamente, puedes limpiar el token expirado
          localStorage.removeItem('token')
          
          return // Salir de la función
        }
        
        // Verificar si es un error de fecha de expiración
        if (response.status === 400 && 
            ((parsedError.details && parsedError.details.includes("Error en la fecha de expiracion")) ||
             (typeof parsedError.details === 'string' && 
              (() => {
                try {
                  const detailsObj = JSON.parse(parsedError.details);
                  return detailsObj.message && detailsObj.message.includes("Error en la fecha de expiracion");
                } catch (e) {
                  return false;
                }
              })()))) {
          
          // Mostrar mensaje específico para error de fecha
          toast({
            title: "Error en la fecha de expiración",
            description: "El formato de la fecha de expiración no es válido. Por favor, verifica que la fecha sea correcta.",
            variant: "destructive",
          })
          
          return // Salir de la función
        }
        
        throw new Error(`Error ${response.status}: ${errorData}`)
      }
      
      const responseData = await response.json()
      
      // Mostrar notificación de éxito con el estilo solicitado (usando sonnerToast)
      sonnerToast.success(
        "Producto registrado correctamente",
        {
          description: `El producto ${values.codigo} ha sido registrado en el sistema.`,
          duration: 5000,
          position: 'top-center',
          style: {
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            border: '1px solid #10b981',
            borderRadius: '8px'
          }
        }
      )
      
      // Resetear formulario con los valores por defecto
      form.reset({
        codigo: "",
        descripcion: "",
        marca: "",
        unidadBase: "",
        division: "",
        linea: "",
        sublinea: "",
        lote: "",
        fechaExpiracion: new Date(),
        minimos: 0,
        maximos: 0,
        creadoPor: nombreUsuario || "",
        cantidadNeta: 0,
        presentaciones: [
          {
            codigo: "",
            tipoPresentacion: "",
            descripcionPresentacion: "",
            cantidad: 1,
            equivalenciaEnBase: 1
          }
        ],
      })
      
      // Redirigir a la misma página para reiniciar completamente la vista
      // y desplazarse al inicio de la página
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        })
        
        // Recargar la página actual para reiniciar completamente la vista
        router.refresh()
      }, 1000)
    } catch (error) {
      console.error("Error al registrar producto:", error)
      
      // Toast normal para error
      toast({
        title: "Error al registrar producto",
        description: `Ocurrió un error al intentar registrar el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        variant: "destructive",
      })
      
      // Notificación tipo SweetAlert para error con sonner
      sonnerToast.error(
        `Error al registrar producto`,
        {
          description: `Ocurrió un error al intentar registrar el producto. Por favor, verifica los datos e intenta nuevamente.`,
          duration: 5000,
          position: 'top-center',
          style: { 
            backgroundColor: '#ef4444', 
            color: 'white',
            border: 'none',
            fontSize: '16px',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          },
          icon: '⚠️',
          closeButton: true
        }
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para agregar una nueva presentación
  const addPresentacion = () => {
    const presentaciones = form.getValues("presentaciones") || []
    const unidadBase = form.getValues("unidadBase") || ""
    
    // Determinar el valor de equivalenciaEnBase según el tipo de presentación
    // Si es PIEZA, siempre debe ser 1, para otros casos usar 1 como valor predeterminado
    const equivalenciaEnBase = unidadBase === "PIEZA" ? 1 : 1
    
    form.setValue("presentaciones", [
      ...presentaciones,
      {
        codigo: "",
        tipoPresentacion: unidadBase, // Usar la unidad base actual
        descripcionPresentacion: "",
        cantidad: 1,
        equivalenciaEnBase: equivalenciaEnBase
      }
    ])
  }

  // Función para eliminar una presentación
  const removePresentacion = (index: number) => {
    const presentaciones = form.getValues("presentaciones")
    if (presentaciones.length > 1) {
      form.setValue(
        "presentaciones",
        presentaciones.filter((_, i) => i !== index)
      )
    } else {
      toast({
        title: "No se puede eliminar",
        description: "Debe haber al menos una presentación.",
        variant: "destructive",
      })
    }
  }

  // Función para procesar los datos del QR escaneado
  const handleQrScanSuccess = (qrData: Record<string, any>) => {
    try {
      // Actualizar los campos del formulario con los datos del QR
      if (qrData.codigo) {
        form.setValue("codigo", qrData.codigo);
      }
      // Verificar que los datos tienen la estructura esperada
      if (!qrData || typeof qrData !== 'object') {
        sonnerToast.error("Formato de QR inválido", {
          description: "El código QR no contiene un objeto JSON válido."
        });
        return;
      }
      
      // Limpiar el formulario antes de llenarlo con nuevos datos
      form.reset({
        ...form.getValues(),
        codigo: "",
        descripcion: "",
        marca: "",
        unidadBase: "",
        division: "",
        linea: "",
        sublinea: "",
        lote: "",
        creadoPor: "",
        minimos: 0,
        maximos: 0,
        cantidadNeta: 0
      });
      
      // Actualizar el formulario con los datos del QR
      // Código
      if (qrData.codigo) {
        form.setValue("codigo", String(qrData.codigo).trim());
      }
      
      // Descripción
      if (qrData.descripcion) {
        form.setValue("descripcion", String(qrData.descripcion).trim());
      }
      
      // Marca
      if (qrData.marca) {
        form.setValue("marca", String(qrData.marca).trim());
      }
      
      // Unidad Base
      if (qrData.unidadBase) {
        form.setValue("unidadBase", String(qrData.unidadBase).trim());
      }
      
      // División
      if (qrData.division) {
        form.setValue("division", String(qrData.division).trim());
      }
      
      // Línea
      if (qrData.linea) {
        form.setValue("linea", String(qrData.linea).trim());
      }
      
      // Sublínea
      if (qrData.sublinea) {
        form.setValue("sublinea", String(qrData.sublinea).trim());
      }
      
      // Lote
      if (qrData.lote) {
        form.setValue("lote", String(qrData.lote).trim());
      }
      
      // Creado Por
      if (qrData.creadoPor) {
        form.setValue("creadoPor", String(qrData.creadoPor).trim());
      }
      
      // Actualizar campos numéricos - asegurar que sean números
      if (qrData.minimos !== undefined) {
        const minimos = typeof qrData.minimos === 'string' ? parseInt(qrData.minimos) : Number(qrData.minimos);
        form.setValue("minimos", isNaN(minimos) ? 0 : minimos);
      }
      
      if (qrData.maximos !== undefined) {
        const maximos = typeof qrData.maximos === 'string' ? parseInt(qrData.maximos) : Number(qrData.maximos);
        form.setValue("maximos", isNaN(maximos) ? 0 : maximos);
      }
      
      if (qrData.cantidadNeta !== undefined) {
        const cantidadNeta = typeof qrData.cantidadNeta === 'string' ? parseInt(qrData.cantidadNeta) : Number(qrData.cantidadNeta);
        form.setValue("cantidadNeta", isNaN(cantidadNeta) ? 0 : cantidadNeta);
      }
      
      // Manejar la fecha de expiración si existe
      if (qrData.fechaExpiracion) {
        try {
          const fecha = new Date(qrData.fechaExpiracion);
          if (!isNaN(fecha.getTime())) {
            form.setValue("fechaExpiracion", fecha);
          }
        } catch (error) {
          console.error("Error al procesar la fecha:", error);
        }
      }
      
      // No actualizamos las presentaciones, como se solicitó
      
      setShowQrScanner(false); // Ocultar el escáner después de escanear
      
      sonnerToast.success("Datos cargados correctamente", {
        description: `Se ha cargado la información del producto ${qrData.codigo}.`,
        duration: 5000,
        position: 'top-center',
        style: { 
          backgroundColor: '#10b981', 
          color: 'white',
          border: 'none',
          fontSize: '16px',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        },
        icon: '✅',
        closeButton: true
      });
    } catch (error) {
      console.error("Error al procesar los datos del QR:", error);
      sonnerToast.error("Error al procesar el código QR", {
        description: "El formato del código QR no es válido."
      });
    }
  };

  // Función para alternar la visibilidad del escáner QR
  const toggleQrScanner = () => {
    setShowQrScanner(!showQrScanner);
  };

  // Función para manejar la finalización de la animación
  const handleAnimationComplete = () => {
    setShowSuccessAnimation(false);
  };

  return (
    <>
      {/* Animación de éxito */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <SuccessAnimation 
            message={successMessage}
            onComplete={handleAnimationComplete}
          />
        )}
      </AnimatePresence>
      
      {showQrScanner && (
        <QrScanner 
          onCancel={() => setShowQrScanner(false)}
          onScanSuccess={(data: Record<string, any>) => {
            // Actualizar los campos del formulario con los datos del QR
            if (data.codigo) form.setValue("codigo", String(data.codigo).trim());
            if (data.descripcion) form.setValue("descripcion", String(data.descripcion).trim());
            if (data.marca) form.setValue("marca", String(data.marca).trim());
            if (data.unidadBase) form.setValue("unidadBase", String(data.unidadBase).trim());
            
            // Cerrar el escáner
            setShowQrScanner(false);
            
            // Mostrar notificación de éxito
            sonnerToast.success("Datos cargados correctamente", {
              description: "Los datos del código QR han sido cargados en el formulario.",
              duration: 3000
            });
          }}
        />
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex justify-end mb-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={toggleQrScanner}
            className="text-naval-600 border-naval-200 hover:bg-naval-100"
          >
            <QrCode className="h-4 w-4 mr-2" />
            {showQrScanner ? "Ocultar Escáner QR" : "Escanear QR"}
          </Button>
        </div>
        
        {showQrScanner && (
          <QrScanner 
            onScanSuccess={handleQrScanSuccess} 
            onCancel={() => setShowQrScanner(false)}
          />
        )}
        <Card className="bg-naval-50/50 border-naval-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4 text-naval-700">
              <Stethoscope className="h-5 w-5" />
              <h3 className="font-medium">Información del Producto</h3>
            </div>
            
            {/* Usamos un layout más estructurado con alturas fijas para evitar descuadres */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Primera fila: Código y Marca */}
              <div className="flex flex-col h-24"> {/* Altura fija para cada contenedor */}
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-naval-700">Código</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej. PROD-001"
                          {...field}
                          className="border-naval-200 focus-visible:ring-naval-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col h-24"> {/* Altura fija para cada contenedor */}
                <FormField
                  control={form.control}
                  name="marca"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-naval-700">Marca</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej. MediTech"
                          {...field}
                          className="border-naval-200 focus-visible:ring-naval-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Segunda fila: Descripción (ocupa todo el ancho) */}
              <div className="flex flex-col h-32 md:col-span-2"> {/* Altura fija más grande para el textarea */}
                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-naval-700">Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descripción detallada del producto"
                          {...field}
                          className="border-naval-200 focus-visible:ring-naval-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Cuarta fila: Unidad Base y Lote */}
              <div className="flex flex-col h-24"> {/* Altura fija para cada contenedor */}
                <FormField
                  control={form.control}
                  name="unidadBase"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-naval-700">Unidad Base</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          
                          // Actualizar el tipo de presentación en todas las presentaciones
                          const presentaciones = form.getValues("presentaciones") || [];
                          if (presentaciones.length > 0) {
                            const updatedPresentaciones = presentaciones.map(p => ({
                              ...p,
                              tipoPresentacion: value,
                              // Si la unidad base es PIEZA, establecer equivalenciaEnBase a 1
                              ...(value === "PIEZA" ? { equivalenciaEnBase: 1 } : {})
                            }));
                            form.setValue("presentaciones", updatedPresentaciones);
                          }
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-naval-200 focus-visible:ring-naval-500">
                            <SelectValue placeholder="Selecciona una unidad base" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unidadesBaseOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col h-24"> {/* Altura fija para cada contenedor */}
                <FormField
                  control={form.control}
                  name="lote"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-naval-700">Lote</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej. LOT-2025-001"
                          {...field}
                          className="border-naval-200 focus-visible:ring-naval-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-naval-50/50 border-naval-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4 text-naval-700">
              <PackageOpen className="h-5 w-5" />
              <h3 className="font-medium">Clasificación y Detalles</h3>
            </div>

            {/* Usamos un layout más estructurado con alturas fijas para evitar descuadres */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Primera fila: División y Línea */}
              <div className="flex flex-col h-24"> {/* Altura fija para cada contenedor */}
                <FormField
                  control={form.control}
                  name="division"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-naval-700">División</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej. Insumos Médicos"
                          {...field}
                          className="border-naval-200 focus-visible:ring-naval-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col h-24"> {/* Altura fija para cada contenedor */}
                <FormField
                  control={form.control}
                  name="linea"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-naval-700">Línea</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej. Material de Curación"
                          {...field}
                          className="border-naval-200 focus-visible:ring-naval-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Segunda fila: Sublínea y Fecha de Expiración */}
              <div className="flex flex-col h-24"> {/* Altura fija para cada contenedor */}
                <FormField
                  control={form.control}
                  name="sublinea"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-naval-700">Sublínea</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej. Guantes"
                          {...field}
                          className="border-naval-200 focus-visible:ring-naval-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col h-24"> {/* Altura fija para cada contenedor */}
                <FormField
                  control={form.control}
                  name="fechaExpiracion"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-naval-700">Fecha de Expiración</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal border-naval-200",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="border-naval-200"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-naval-50/50 border-naval-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4 text-naval-700">
              <PackageOpen className="h-5 w-5" />
              <h3 className="font-medium">Información de Inventario</h3>
            </div>

            {/* Usamos un layout más estructurado con alturas fijas para evitar descuadres */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Primera fila: Cantidad Mínima y Máxima */}
              <div className="flex flex-col h-24"> {/* Altura fija para cada contenedor */}
                <FormField
                  control={form.control}
                  name="minimos"
                  render={({ field }) => {
                    // Manejar cambios en la cantidad mínima
                    const handleMinimosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                      // Permitir campo vacío
                      if (e.target.value === "") {
                        field.onChange("");
                        return;
                      }
                      
                      const value = parseInt(e.target.value);
                      if (!isNaN(value)) {
                        field.onChange(value);
                        
                        // Verificar si la cantidad neta actual está por debajo del nuevo mínimo
                        const cantidadNeta = form.getValues('cantidadNeta') || 0;
                        if (cantidadNeta < value && cantidadNeta > 0) {
                          sonnerToast.info("Cantidad por debajo del mínimo", {
                            description: `La cantidad neta actual (${cantidadNeta}) está por debajo del mínimo recomendado (${value})`,
                            duration: 3000
                          });
                        }
                      }
                    };
                    
                    return (
                      <FormItem className="flex-1">
                        <FormLabel className="text-naval-700">Cantidad Mínima</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={handleMinimosChange}
                            className="border-naval-200 focus-visible:ring-naval-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <div className="flex flex-col h-24"> {/* Altura fija para cada contenedor */}
                <FormField
                  control={form.control}
                  name="maximos"
                  render={({ field }) => {
                    // Manejar cambios en la cantidad máxima
                    const handleMaximosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                      // Permitir campo vacío
                      if (e.target.value === "") {
                        field.onChange("");
                        return;
                      }
                      
                      const newMaxValue = parseInt(e.target.value);
                      if (!isNaN(newMaxValue)) {
                        field.onChange(newMaxValue);
                        
                        // Verificar si la cantidad neta actual excede el nuevo máximo
                        const cantidadNeta = form.getValues('cantidadNeta');
                        if (newMaxValue > 0 && cantidadNeta > newMaxValue) {
                          // Actualizar la cantidad neta al nuevo máximo
                          form.setValue('cantidadNeta', newMaxValue);
                          sonnerToast.info("Cantidad neta ajustada", {
                            description: `La cantidad neta ha sido ajustada a ${newMaxValue} para coincidir con el nuevo máximo`,
                            duration: 3000
                          });
                        }
                      }
                    };
                    
                    return (
                      <FormItem className="flex-1">
                        <FormLabel className="text-naval-700">Cantidad Máxima</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={handleMaximosChange}
                            className="border-naval-200 focus-visible:ring-naval-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              {/* Segunda fila: Cantidad Neta y Creado Por */}
              <div className="flex flex-col h-24"> {/* Altura fija para cada contenedor */}
                <FormField
                  control={form.control}
                  name="cantidadNeta"
                  render={({ field }) => {
                    const maximos = form.watch('maximos') || 0;
                    
                    // Validar que la cantidad neta esté dentro de los límites (mínimo y máximo)
                    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                      // Permitir campo vacío
                      if (e.target.value === "") {
                        field.onChange("");
                        return;
                      }
                      
                      const value = parseInt(e.target.value);
                      const minimos = form.watch('minimos') || 0;
                      
                      if (!isNaN(value)) {
                        // Si el valor es mayor que máximos, establecerlo a máximos
                        if (value > maximos && maximos > 0) {
                          field.onChange(maximos);
                          sonnerToast.warning("Cantidad excedida", {
                            description: `La cantidad neta no puede ser mayor que la cantidad máxima (${maximos})`,
                            duration: 3000
                          });
                          // Función para manejar la finalización de la animación
                          const handleAnimationComplete = () => {
                            setShowSuccessAnimation(false);
                          };

                          return (
                            <>
                              {/* Animación de éxito */}
                              <AnimatePresence>
                                {showSuccessAnimation && (
                                  <SuccessAnimation 
                                    message={successMessage}
                                    onComplete={handleAnimationComplete}
                                  />
                                )}
                              </AnimatePresence>
                              
                              {showQrScanner && (
                                <QrScanner 
                                  onCancel={() => setShowQrScanner(false)}
                                  onScanSuccess={(data: Record<string, any>) => {
                                    setShowQrScanner(false)
                                    if (data && data.codigo) {
                                      form.setValue("codigo", data.codigo)
                                    }
                                  }}
                                />
                              )}
                              
                              <Form {...form}>
                                <div ref={formRef}>
                                  <FormItem className="flex-1">
                                    <FormLabel className="text-naval-700">Cantidad Neta</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="0"
                                        max={maximos > 0 ? maximos : undefined}
                                        {...field}
                                        onChange={handleChange}
                                        className="border-naval-200 focus-visible:ring-naval-500"
                                      />
                                    </FormControl>
                                    {/* Mostrar mensaje según si la cantidad está por debajo del mínimo o por encima del máximo */}
                                    {(() => {
                                      const minimos = form.watch('minimos') || 0;
                                      const cantidadActual = field.value || 0;
                                      
                                      if (cantidadActual < minimos && minimos > 0) {
                                        return (
                                          <p className="text-xs text-amber-600 mt-1">Cantidad mínima recomendada: {minimos}</p>
                                        );
                                      } else if (maximos > 0) {
                                        return (
                                          <p className="text-xs text-blue-600 mt-1">Máximo permitido: {maximos}</p>
                                        );
                                      }
                                      return null;
                                    })()}
                                    <FormMessage />
                                  </FormItem>
                                </div>
                              </Form>
                            </>
                          );
                        } else {
                          field.onChange(value);
                          
                          
                        }
                      }
                    };
                    
                    return (
                      <FormItem className="flex-1">
                        <FormLabel className="text-naval-700">Cantidad Neta</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max={maximos > 0 ? maximos : undefined}
                            {...field}
                            onChange={handleChange}
                            className="border-naval-200 focus-visible:ring-naval-500"
                          />
                        </FormControl>
                        {/* Mostrar mensaje según si la cantidad está por debajo del mínimo o por encima del máximo */}
                        {(() => {
                          const minimos = form.watch('minimos') || 0;
                          const cantidadActual = field.value || 0;
                          
                          if (cantidadActual < minimos && minimos > 0) {
                            return (
                              <p className="text-xs text-amber-600 mt-1">Cantidad mínima recomendada: {minimos}</p>
                            );
                          } else if (maximos > 0) {
                            return (
                              <p className="text-xs text-blue-600 mt-1">Máximo permitido: {maximos}</p>
                            );
                          }
                          return null;
                        })()}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>

              <div className="flex flex-col h-24"> {/* Altura fija para cada contenedor */}
                <FormField
                  control={form.control}
                  name="creadoPor"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-naval-700">Creado Por</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre del usuario"
                          {...field}
                          className="border-naval-200 focus-visible:ring-naval-500"
                          readOnly={!!nombreUsuario}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-naval-50/50 border-naval-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-naval-700">
                <PackageOpen className="h-5 w-5" />
                <h3 className="font-medium">Presentaciones</h3>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addPresentacion}
                className="text-naval-600 border-naval-200 hover:bg-naval-100"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Agregar Presentación
              </Button>
            </div>

            {form.watch("presentaciones").map((_, index) => (
              <div key={index} className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-naval-600">Presentación {index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePresentacion(index)}
                    className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="p-4 border border-naval-100 rounded-md bg-white">
                  {/* Usamos un layout más estructurado con alturas fijas para evitar descuadres */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Primera fila: Código y Tipo de Presentación */}
                    <div className="flex flex-col h-24"> {/* Altura fija para cada contenedor */}
                      <FormField
                        control={form.control}
                        name={`presentaciones.${index}.codigo`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-naval-700">Código</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej. PRES-001"
                                {...field}
                                className="border-naval-200 focus-visible:ring-naval-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex flex-col h-24"> {/* Altura fija para cada contenedor */}
                      <FormField
                        control={form.control}
                        name={`presentaciones.${index}.tipoPresentacion`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-naval-700">Tipo de Presentación</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej. Caja"
                                {...field}
                                className="border-naval-200 focus-visible:ring-naval-500 bg-gray-50"
                                readOnly={true}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Segunda fila: Descripción y Cantidad */}
                    <div className="flex flex-col h-24"> {/* Altura fija para cada contenedor */}
                      <FormField
                        control={form.control}
                        name={`presentaciones.${index}.descripcionPresentacion`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-naval-700">Descripción</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej. Caja con 100 unidades"
                                {...field}
                                className="border-naval-200 focus-visible:ring-naval-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex flex-col h-24"> {/* Altura fija para cada contenedor */}
                      <FormField
                        control={form.control}
                        name={`presentaciones.${index}.cantidad`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-naval-700">Cantidad</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                className="border-naval-200 focus-visible:ring-naval-500"
                              />
                            </FormControl>
                            {form.watch('cantidadNeta') > 0 && cantidadRestante !== 0 && (
                              <p className={`text-xs mt-1 ${cantidadRestante > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                                {cantidadRestante > 0 
                                  ? `Faltan ${cantidadRestante} unidades por asignar` 
                                  : `Exceso de ${Math.abs(cantidadRestante)} unidades`}
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Tercera fila: Equivalencia en Unidad Base (solo si no es PIEZA) */}
                    {form.watch(`presentaciones.${index}.tipoPresentacion`) !== "PIEZA" && (
                      <div className="flex flex-col h-24 md:col-span-2"> {/* Altura fija para cada contenedor */}
                        <FormField
                          control={form.control}
                          name={`presentaciones.${index}.equivalenciaEnBase`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-naval-700">Equivalencia en Unidad Base</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  className="border-naval-200 focus-visible:ring-naval-500"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                    
                    {/* Si es PIEZA, mantener el valor 1 pero no mostrar el campo */}
                    {form.watch(`presentaciones.${index}.tipoPresentacion`) === "PIEZA" && (
                      <input 
                        type="hidden" 
                        {...form.register(`presentaciones.${index}.equivalenciaEnBase`)} 
                        value="1" 
                      />
                    )}
                  </div>
                </div>
                {index < form.watch("presentaciones").length - 1 && (
                  <Separator className="my-4" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Mensaje de advertencia antes del botón para evitar descuadres */}
        {/* {form.watch('cantidadNeta') > 0 && cantidadRestante !== 0 && (
          <div className="mb-4 text-sm w-full">
            <p className={`p-2 rounded-md ${cantidadRestante > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {cantidadRestante > 0 
                ? `⚠️ Faltan ${cantidadRestante} unidades por asignar en presentaciones` 
                : `⚠️ Hay un exceso de ${Math.abs(cantidadRestante)} unidades en presentaciones`}
            </p>
          </div>
        )} */}

        {/* Botón de envío */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting || (form.watch('cantidadNeta') > 0 && cantidadRestante !== 0)} 
            className="bg-naval-600 hover:bg-naval-700"
          >
            {isSubmitting ? "Registrando..." : "Registrar Producto"}
          </Button>
        </div>
      </form>
    </Form>
    </>
  )
}