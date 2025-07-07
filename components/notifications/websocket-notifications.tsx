"use client"

import React, { useEffect, useState, useRef, useCallback, memo } from 'react'
import { Bell, AlertTriangle, Info, Package, Layers, ChevronRight, X, Check, BarChart3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import websocketService, { Notification, NotificationType } from '@/services/websocket-service'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface NotificationItem extends Notification {
  id: string;
  read: boolean;
}

interface NotificationDetailProps {
  notification: NotificationItem;
  onClose: () => void;
}

// Extraer la función formatDate para usarla en ambos componentes
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Componente para mostrar los detalles de una notificación
const NotificationDetail = memo(({ notification, onClose }: NotificationDetailProps) => {
  const data = notification.data || {};
  
  // Acceder directamente a los datos del producto desde el payload parseado
  const productCode = data.codigo || 'N/A';
  const productName = data.descripcion || 'Producto';
  const lotNumber = data.lote || 'N/A';
  
  // Información de stock - usar cantidadNetaActual como stock actual
  const currentStock = data.cantidadNetaActual !== undefined ? data.cantidadNetaActual : 0;
  const previousStock = data.stockAnterior !== undefined ? data.stockAnterior : 0;
  const minStock = data.minimos !== undefined ? data.minimos : 0;
  const maxStock = data.maximos !== undefined ? data.maximos : 0;
  
  // Calcular porcentaje para la barra de progreso
  // Si el máximo es 0, usar 100 como valor predeterminado para evitar división por cero
  const maxForCalculation = maxStock > 0 ? maxStock : 100;
  // Limitar el porcentaje entre 0 y 100
  const stockPercentage = Math.max(0, Math.min(100, (currentStock / maxForCalculation) * 100));
  
  // Determinar color de la barra de progreso según el nivel de stock
  const getProgressColor = () => {
    if (currentStock <= minStock) return 'bg-red-500';
    if (currentStock <= minStock * 1.5) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-full ${notification.type === 'critico' ? 'bg-red-100' : 'bg-amber-100'}`}>
          {notification.type === 'critico' ? (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          ) : (
            <Info className="h-4 w-4 text-amber-600" />
          )}
        </div>
        <div>
          <h3 className="font-medium">
            {notification.type === 'critico' ? 'Alerta Crítica' : 'Alerta Preventiva'}
          </h3>
          <p className="text-xs text-gray-500">
            {formatDate(notification.timestamp)}
          </p>
        </div>
      </div>
      
      <div className="mb-3">
        <p className="text-sm text-gray-700">{notification.message}</p>
      </div>
      
      <div className="bg-gray-50 p-3 rounded-md mb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Package className="h-3.5 w-3.5 text-gray-500" />
          <h4 className="text-sm font-medium">Información del Producto</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-white p-1.5 rounded border border-gray-100">
            <p className="text-xs text-gray-500">Código</p>
            <p className="text-sm font-medium">{productCode}</p>
          </div>
          <div className="bg-white p-1.5 rounded border border-gray-100">
            <p className="text-xs text-gray-500">Producto</p>
            <p className="text-sm font-medium truncate">{productName}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-white p-1.5 rounded border border-gray-100">
            <p className="text-xs text-gray-500">Lote</p>
            <p className="text-sm font-medium">{lotNumber}</p>
          </div>
          <div className="bg-white p-1.5 rounded border border-gray-100">
            <p className="text-xs text-gray-500">Stock Anterior</p>
            <p className="text-sm font-medium">{previousStock}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="bg-white p-1.5 rounded border border-gray-100">
            <p className="text-xs text-gray-500">Stock Actual</p>
            <p className="text-sm font-medium">{currentStock}</p>
          </div>
          <div className="bg-white p-1.5 rounded border border-gray-100">
            <p className="text-xs text-gray-500">Mínimo</p>
            <p className="text-sm font-medium text-red-600">{minStock}</p>
          </div>
          <div className="bg-white p-1.5 rounded border border-gray-100">
            <p className="text-xs text-gray-500">Máximo</p>
            <p className="text-sm font-medium text-green-600">{maxStock}</p>
          </div>
        </div>
        
        <div className="bg-white p-2 rounded border border-gray-100">
          <div className="flex justify-between text-xs mb-1">
            <span>Nivel de Stock</span>
            <span>{stockPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
            <div 
              className={`h-2 rounded-full ${getProgressColor()}`}
              style={{ width: `${stockPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-red-600">Min: {minStock}</span>
            <span className="text-green-600">Max: {maxStock}</span>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mb-3">
        <p>Notificación recibida el {new Intl.DateTimeFormat('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }).format(notification.timestamp)}
        </p>
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={onClose}
          className="bg-naval-600 hover:bg-naval-700 text-white text-sm py-1 h-8"
        >
          Cerrar
        </Button>
      </div>
    </div>
  );
});

const WebSocketNotifications = () => {
  // Estados
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)
  
  // Referencias
  const recentNotificationsRef = useRef<Set<string>>(new Set())
  const notificationTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Generar una clave única para la notificación basada en su contenido
  const generateNotificationKey = useCallback((notification: Notification): string => {
    const data = notification.data || {};
    const code = data.codigo || data.code || '';
    const timestamp = data.timestamp || '';
    const description = notification.message || '';
    
    return `${notification.type}--${timestamp}-${description}`;
  }, []);
  
  // Marcar todas las notificaciones como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => 
      prev.map((notification) => ({ ...notification, read: true }))
    )
  }, []);

  // Marcar una notificación específica como leída
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => 
      prev.map((notification) => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }, []);

  // Eliminar una notificación
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, []);

  // Función para manejar las notificaciones recibidas
  const handleNotification = useCallback((notification: Notification) => {
    // Crear una clave única para esta notificación
    const notificationKey = generateNotificationKey(notification);
    
    // Verificar si ya hemos procesado recientemente esta notificación
    if (recentNotificationsRef.current.has(notificationKey)) {
      return;
    }
    
    // Registrar esta notificación como procesada
    recentNotificationsRef.current.add(notificationKey);
    
    // Eliminar de la lista después de un tiempo para evitar acumulación
    const timeoutId = setTimeout(() => {
      recentNotificationsRef.current.delete(notificationKey);
    }, 10000); // 10 segundos
    
    // Añadir un ID único a la notificación
    const notificationWithId = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 7)}`,
      read: false
    };
    
    // Actualizar el estado de notificaciones
    setNotifications(prev => [notificationWithId, ...prev]);
  }, [generateNotificationKey]);
  
  // Efecto para conectar al WebSocket y registrar listeners
  useEffect(() => {
    // console.log('Inicializando WebSocket...');
    
    // Iniciar la conexión
    websocketService.connect();
    
    // Suscribirse a las notificaciones
    websocketService.addListener('critico', handleNotification);
    websocketService.addListener('preventivo', handleNotification);
    
    // Verificar el estado de la conexión periódicamente
    const connectionCheckInterval = setInterval(() => {
      setIsConnected(websocketService.isConnected());
    }, 2000);
    
    // Limpiar suscripciones al desmontar
    return () => {
      // console.log('Limpiando WebSocket...');
      websocketService.removeListener('critico', handleNotification);
      websocketService.removeListener('preventivo', handleNotification);
      
      // Limpiar todos los timeouts pendientes
      notificationTimeoutRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      notificationTimeoutRef.current.clear();
      recentNotificationsRef.current.clear();
      
      // Desconectar el servicio WebSocket
      websocketService.disconnect();
      clearInterval(connectionCheckInterval);
    };
  }, [handleNotification]); // Dependencia: handleNotification
  
  // Obtener el número de notificaciones no leídas
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  // Renderizar icono según el tipo de notificación
  const renderNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'critico':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'preventivo':
        return <Info className="h-4 w-4 text-amber-500" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  // Obtener el título según el tipo de notificación
  const getNotificationTitle = (type: NotificationType): string => {
    switch (type) {
      case 'critico':
        return 'Alerta Crítica'
      case 'preventivo':
        return 'Alerta Preventiva'
      default:
        return 'Notificación'
    }
  }
  
  // Obtener color de fondo según el tipo de notificación
  const getNotificationBgColor = (type: NotificationType, read: boolean): string => {
    if (read) return ''; // Sin color de fondo si ya fue leída
    
    switch (type) {
      case 'critico':
        return 'bg-red-50'
      case 'preventivo':
        return 'bg-amber-50'
      default:
        return 'bg-naval-50'
    }
  }
  
  // Obtener color de borde según el tipo de notificación
  const getNotificationBorderColor = (type: NotificationType): string => {
    switch (type) {
      case 'critico':
        return 'border-l-4 border-l-red-500'
      case 'preventivo':
        return 'border-l-4 border-l-amber-500'
      default:
        return ''
    }
  }

  return (
    <>
      <DropdownMenu>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className={`h-5 w-5 ${isConnected ? 'text-naval-600' : 'text-gray-400'}`} />
                  {unreadCount > 0 && (
                    <Badge
                      variant={notifications.some(n => !n.read && n.type === 'critico') ? "destructive" : "secondary"}
                      className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs
                        ${notifications.some(n => !n.read && n.type === 'critico') ? 'bg-red-500' : 'bg-amber-500'}`}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{isConnected ? 'Notificaciones en tiempo real' : 'Conectando...'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <DropdownMenuContent className="w-96" align="end">
          <DropdownMenuLabel className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span>Notificaciones</span>
              {isConnected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  Conectado
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">
                  Desconectado
                </Badge>
              )}
            </div>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={markAllAsRead}
              >
                <Check className="h-3 w-3 mr-1" />
                Marcar todo como leído
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <div className="max-h-[350px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-6 px-2 text-center text-sm text-gray-500">
                <div className="flex justify-center mb-2">
                  <Bell className="h-10 w-10 text-gray-300" />
                </div>
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <DropdownMenuGroup>
                {notifications.map((notification) => {
                  // Extraer datos relevantes para mostrar
                  const data = notification.data || {};
                  
                  // console.log para debugging - mostrar la estructura completa de los datos
                  // console.log('Datos de notificación en componente:', {
                  //   id: notification.id,
                  //   tipo: notification.type,
                  //   mensaje: notification.message,
                  //   datos: data,
                  //   propiedadesDisponibles: Object.keys(data)
                  // });
                  
                  // Acceder directamente a los datos del producto desde el payload parseado
                  const productCode = data.codigo || '';
                  const productName = data.descripcion || '';
                  const lotNumber = data.lote || '';
                  
                  // Información de stock - usar cantidadNetaActual como stock actual
                  const currentStock = data.cantidadNetaActual !== undefined ? data.cantidadNetaActual : 0;
                  const previousStock = data.stockAnterior !== undefined ? data.stockAnterior : 0;
                  const minStock = data.minimos !== undefined ? data.minimos : 0;
                  const maxStock = data.maximos !== undefined ? data.maximos : 0;
                  
                  return (
                    <div 
                      key={notification.id}
                      className={`
                        p-3 cursor-pointer hover:bg-gray-50 transition-colors
                        ${getNotificationBgColor(notification.type, notification.read)}
                        ${getNotificationBorderColor(notification.type)}
                      `}
                      onClick={() => {
                        markAsRead(notification.id);
                        setSelectedNotification(notification);
                      }}
                    >
                      <div className="flex w-full justify-between items-start">
                        <div className="flex items-center gap-2">
                          {renderNotificationIcon(notification.type)}
                          <span className={`font-medium ${notification.type === 'critico' ? 'text-red-700' : 'text-amber-700'}`}>
                            {getNotificationTitle(notification.type)}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(notification.id)
                            }}
                          >
                            <span className="sr-only">Marcar como leído</span>
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeNotification(notification.id)
                            }}
                          >
                            <span className="sr-only">Eliminar</span>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Información del producto */}
                      {(productCode || productName) && (
                        <div className="mt-2 bg-white rounded-md p-2 border border-gray-100">
                          <div className="flex items-center gap-2">
                            <Package className="h-3.5 w-3.5 text-gray-500" />
                            <div className="text-sm font-medium truncate">
                              {productCode && <span className="text-gray-700">{productCode}</span>}
                              {productCode && productName && <span className="mx-1 text-gray-400">|</span>}
                              {productName && <span className="text-gray-600">{productName}</span>}
                            </div>
                          </div>
                          
                          {lotNumber && (
                            <div className="mt-1 flex items-center gap-1">
                              <BarChart3 className="h-3.5 w-3.5 text-gray-500" />
                              <span className="text-xs text-gray-600">Lote: </span>
                              <span className="text-xs font-medium text-gray-700">{lotNumber}</span>
                            </div>
                          )}
                          
                          <div className="mt-1 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Layers className="h-3.5 w-3.5 text-gray-500" />
                              <span className="text-xs text-gray-600">Stock: </span>
                              <span className={`text-xs font-medium ${notification.type === 'critico' ? 'text-red-600' : 'text-amber-600'}`}>
                                {currentStock}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-600">Anterior: </span>
                              <span className="text-xs font-medium text-gray-700">{previousStock}</span>
                            </div>
                          </div>
                          
                          <div className="mt-1 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-red-600">Min: {minStock}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-green-600">Max: {maxStock}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <p className="text-sm mt-2 text-gray-700">{notification.message}</p>
                      
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500">
                          {formatDate(notification.timestamp)}
                        </p>
                        <div className="flex items-center text-xs text-naval-600 font-medium">
                          <span>Ver detalles</span>
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </DropdownMenuGroup>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Modal de detalles de notificación */}
      <Dialog open={selectedNotification !== null} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent className="sm:max-w-md" aria-describedby="notification-details-description">
          <DialogHeader>
            <DialogTitle>Detalles de la notificación</DialogTitle>
            <DialogDescription id="notification-details-description">
              Información detallada sobre la alerta de stock.
            </DialogDescription>
          </DialogHeader>
          
          {selectedNotification && (
            <NotificationDetail 
              notification={selectedNotification} 
              onClose={() => setSelectedNotification(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default WebSocketNotifications;
