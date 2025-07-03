import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getTenantFromToken } from '@/lib/jwt-utils';

// Tipos de notificación
export type NotificationType = 'critico' | 'preventivo';

// Estructura de una notificación
export interface Notification {
  type: NotificationType;
  message: string;
  timestamp: Date;
  data?: any;
}

// Tipo para las funciones de callback de notificaciones
export type NotificationCallback = (notification: Notification) => void;

class WebSocketService {
  private client: Client | null = null;
  private connected: boolean = false;
  private listeners: Map<NotificationType, NotificationCallback[]> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  // Set para almacenar IDs de mensajes ya procesados y evitar duplicados
  private processedMessageIds: Set<string> = new Set();
  // Tiempo máximo (en ms) para mantener un ID en la lista de procesados
  private readonly MESSAGE_ID_EXPIRY_TIME = 10000; // 10 segundos

  constructor() {
    // Inicializar el mapa de listeners para cada tipo de notificación
    this.listeners.set('critico', []);
    this.listeners.set('preventivo', []);
  }

  /**
   * Inicia la conexión al servidor WebSocket
   */
  connect(): void {
    if (this.client) {
      this.disconnect();
    }

    const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || '';
    
    if (!socketUrl) {
      console.error('URL de WebSocket no configurada');
      return;
    }

    try {
      // Crear cliente STOMP
      this.client = new Client({
        webSocketFactory: () => new SockJS(socketUrl),
        debug: function(str) {
          // Desactivar logs en producción, descomentar para debugging
          // console.log('STOMP: ' + str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000
      });

      // Configurar manejadores de eventos
      this.client.onConnect = this.onConnect.bind(this);
      this.client.onStompError = this.onError.bind(this);
      this.client.onWebSocketClose = this.onDisconnect.bind(this);

      // Iniciar conexión
      this.client.activate();
    } catch (error) {
      console.error('Error al conectar al WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Maneja el evento de conexión exitosa
   */
  private onConnect(): void {
    this.connected = true;
    this.reconnectAttempts = 0;

    // Suscribirse a los tópicos
    this.subscribeToTopics();
  }

  /**
   * Suscribe a los tópicos de notificaciones
   */
  private subscribeToTopics(): void {
    if (!this.client || !this.connected) return;

    // Suscribirse al tópico de stock crítico
    this.client.subscribe('/topic/stock/critico', (message: IMessage) => {
      this.handleMessage('critico', message);
    });

    // Suscribirse al tópico de stock preventivo
    this.client.subscribe('/topic/stock/preventivo', (message: IMessage) => {
      this.handleMessage('preventivo', message);
    });
  }

  /**
   * Procesa los mensajes recibidos
   */
  private handleMessage(type: NotificationType, message: IMessage): void {
    try {
      const body = JSON.parse(message.body);
      
      // Procesar el mensaje recibido (sin logs)
      
      // Obtener el tenantId de la notificación
      const notificationTenantId = body.tenantId;
      
      // Obtener el tenantId del usuario actual
      const currentUserTenantId = getTenantFromToken();
      
      // Comparar tenants (sin logs)
      
      // Si los tenantId no coinciden, ignorar la notificación
      if (notificationTenantId && currentUserTenantId !== 'string' && notificationTenantId !== currentUserTenantId) {
        return;
      }
      
      // Generar un ID único para este mensaje basado en su contenido
      const messageId = this.generateMessageId(type, body);
      
      // Verificar si este mensaje ya ha sido procesado (para evitar duplicados)
      if (this.processedMessageIds.has(messageId)) {
        return;
      }
      
      // Registrar este mensaje como procesado
      this.processedMessageIds.add(messageId);
      
      // Programar la eliminación del ID después del tiempo de expiración
      setTimeout(() => {
        this.processedMessageIds.delete(messageId);
      }, this.MESSAGE_ID_EXPIRY_TIME);
      
    
      
      // Manejar el payload (puede ser un objeto JSON o un string simple)
      let parsedPayload: Record<string, any> = {};
      if (body.payload && typeof body.payload === 'string') {
        try {
          // Intentar parsear como JSON solo si parece ser un objeto JSON (comienza con { o [)
          if (body.payload.trim().startsWith('{') || body.payload.trim().startsWith('[')) {
            parsedPayload = JSON.parse(body.payload);
          } else {
            // Si no parece ser JSON, guardarlo como mensaje de texto
            parsedPayload = { mensaje: body.payload };
          }
        } catch (e) {
          // Si falla el parseo, guardarlo como mensaje de texto
          parsedPayload = { mensaje: body.payload };
        }
      } else if (body.payload) {
        parsedPayload = body.payload;
      }
      
      
      
      // Determinar el mensaje basado en el tipo de notificación
      let notificationMessage = body.message || 'Nueva notificación';
      
      // Si el payload contiene un mensaje de texto simple, usarlo como mensaje de notificación
      if (parsedPayload.mensaje && typeof parsedPayload.mensaje === 'string' && !parsedPayload.descripcion) {
        notificationMessage = parsedPayload.mensaje;
      }
      // Si es una notificación de tipo PRODUCTO_AGOTADO
      else if (body.type === 'PRODUCTO_AGOTADO' && parsedPayload) {
        const descripcion = parsedPayload.descripcion || '';
        const codigo = parsedPayload.codigo || '';
        notificationMessage = `Producto agotado: ${descripcion} (${codigo})`;
      } 
      // Si es una notificación de tipo STOCK_BAJO
      else if (body.type === 'STOCK_BAJO' && parsedPayload) {
        const descripcion = parsedPayload.descripcion || '';
        const codigo = parsedPayload.codigo || '';
        notificationMessage = `Stock bajo: ${descripcion} (${codigo})`;
      }
      // Si el tipo es CRITICO o PREVENTIVO y no tiene formato específico
      else if (body.type === 'CRITICO' || body.type === 'PREVENTIVO') {
        // Usar el payload como mensaje si es un string
        if (typeof body.payload === 'string') {
          notificationMessage = body.payload;
        }
      }
      
      const notification: Notification = {
        type,
        message: notificationMessage,
        timestamp: new Date(),
        data: {
          ...body,
          // Añadir los datos parseados del payload para fácil acceso
          ...parsedPayload
        }
      };

      // Notificación lista para ser enviada a los listeners

      // Notificar a todos los listeners registrados para este tipo
      const typeListeners = this.listeners.get(type) || [];
      typeListeners.forEach(callback => {
        try {
          callback(notification);
        } catch (error) {
          console.error(`❌ Error en callback de notificación ${type}:`, error);
        }
      });
    } catch (error) {
      console.error(`Error al procesar mensaje de ${type}:`, error);
    }
  }

  /**
   * Maneja errores de conexión
   */
  private onError(frame: any): void {
    console.error('Error en la conexión WebSocket:', frame);
    this.scheduleReconnect();
  }

  /**
   * Maneja la desconexión
   */
  private onDisconnect(): void {
    this.connected = false;
    this.scheduleReconnect();
  }
  
  /**
   * Genera un ID único para un mensaje basado en su contenido
   * Esto ayuda a identificar mensajes duplicados
   */
  private generateMessageId(type: NotificationType, data: any): string {
    // Usar una combinación de tipo, código (si existe) y timestamp (si existe)
    const code = data.codigo || data.code || '';
    const timestamp = data.timestamp || '';
    const description = data.description || data.descripcion || '';
    
    // Crear un hash simple combinando estos valores
    return `${type}-${code}-${timestamp}-${description.substring(0, 20)}`;
  }

  /**
   * Programa un intento de reconexión
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(30000, 1000 * Math.pow(2, this.reconnectAttempts));
      
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Número máximo de intentos de reconexión alcanzado');
    }
  }

  /**
   * Desconecta del servidor WebSocket
   */
  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    
    this.connected = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Registra un listener para un tipo específico de notificación
   */
  addListener(type: NotificationType, callback: NotificationCallback): void {
    const listeners = this.listeners.get(type) || [];
    listeners.push(callback);
    this.listeners.set(type, listeners);
  }

  /**
   * Elimina un listener específico
   */
  removeListener(type: NotificationType, callback: NotificationCallback): void {
    const listeners = this.listeners.get(type) || [];
    const index = listeners.indexOf(callback);
    
    if (index !== -1) {
      listeners.splice(index, 1);
      this.listeners.set(type, listeners);
    }
  }

  /**
   * Verifica si está conectado al servidor
   */
  isConnected(): boolean {
    return this.connected;
  }
}

// Exportar una única instancia del servicio
const websocketService = new WebSocketService();
export default websocketService;
