import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type NotificationType = 
  | 'chat' 
  | 'order' 
  | 'validation' 
  | 'alert' 
  | 'lead' 
  | 'system';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

interface NotificationsProviderProps {
  children: ReactNode;
}

// Función para generar ID único
const generateId = () => `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Función para formatear tiempo relativo
const getRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'hace unos segundos';
  if (minutes === 1) return 'hace 1 min';
  if (minutes < 60) return `hace ${minutes} min`;
  if (hours === 1) return 'hace 1 hora';
  if (hours < 24) return `hace ${hours} horas`;
  if (days === 1) return 'hace 1 día';
  return `hace ${days} días`;
};

// Notificaciones iniciales
const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'chat',
    title: 'Nuevo mensaje',
    message: 'María González te ha enviado un mensaje en WhatsApp',
    time: 'hace 2 min',
    timestamp: Date.now() - 2 * 60 * 1000,
    read: false,
    priority: 'high',
    actionUrl: '/chat',
  },
  {
    id: '2',
    type: 'order',
    title: 'Nuevo pedido',
    message: 'Pedido #1247 por $320.50 requiere validación',
    time: 'hace 5 min',
    timestamp: Date.now() - 5 * 60 * 1000,
    read: false,
    priority: 'high',
    actionUrl: '/orders',
  },
  {
    id: '3',
    type: 'validation',
    title: 'Cliente validado',
    message: 'Juan Pérez ha sido validado exitosamente',
    time: 'hace 10 min',
    timestamp: Date.now() - 10 * 60 * 1000,
    read: false,
    priority: 'medium',
    actionUrl: '/validation',
  },
  {
    id: '4',
    type: 'alert',
    title: 'Stock bajo',
    message: 'Producto "Zapatillas Nike Air" tiene solo 3 unidades',
    time: 'hace 15 min',
    timestamp: Date.now() - 15 * 60 * 1000,
    read: true,
    priority: 'medium',
    actionUrl: '/shopify',
  },
  {
    id: '5',
    type: 'lead',
    title: 'Lead caliente',
    message: 'Ana Silva ha visitado tu tienda 5 veces esta semana',
    time: 'hace 30 min',
    timestamp: Date.now() - 30 * 60 * 1000,
    read: true,
    priority: 'low',
    actionUrl: '/leads',
  },
  {
    id: '6',
    type: 'system',
    title: 'Sincronización completada',
    message: 'Shopify se sincronizó correctamente con 47 productos',
    time: 'hace 1 hora',
    timestamp: Date.now() - 60 * 60 * 1000,
    read: true,
    priority: 'low',
    actionUrl: '/settings',
  },
];

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    // Cargar notificaciones del localStorage
    const saved = localStorage.getItem('nomadev_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
    return initialNotifications;
  });

  // Actualizar tiempo relativo cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          time: getRelativeTime(n.timestamp),
        }))
      );
    }, 60000); // Cada minuto

    return () => clearInterval(interval);
  }, []);

  // Guardar en localStorage cuando cambian las notificaciones
  useEffect(() => {
    localStorage.setItem('nomadev_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const timestamp = Date.now();
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp,
      time: getRelativeTime(timestamp),
    };

    setNotifications((prev) => [newNotification, ...prev]);

    // Mostrar notificación del navegador si está permitido
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.svg',
        badge: '/favicon.svg',
      });
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Solicitar permiso para notificaciones del navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications debe ser usado dentro de un NotificationsProvider');
  }
  return context;
};

