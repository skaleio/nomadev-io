import React, { useState } from 'react';
import {
  Bell,
  Check,
  X,
  MessageSquare,
  ShoppingCart,
  Shield,
  AlertTriangle,
  Users,
  Package,
  Clock,
  Trash2,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useNotifications, type NotificationType } from '@/contexts/NotificationsContext';

const notificationIcons: Record<NotificationType, React.ElementType> = {
  chat: MessageSquare,
  order: ShoppingCart,
  validation: Shield,
  alert: AlertTriangle,
  lead: Users,
  system: Package,
};

const notificationColors: Record<NotificationType, string> = {
  chat: 'text-blue-500 bg-blue-500/10',
  order: 'text-green-500 bg-green-500/10',
  validation: 'text-purple-500 bg-purple-500/10',
  alert: 'text-red-500 bg-red-500/10',
  lead: 'text-orange-500 bg-orange-500/10',
  system: 'text-gray-500 bg-gray-500/10',
};

const priorityColors: Record<string, string> = {
  low: 'bg-blue-500/10 text-blue-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  high: 'bg-red-500/10 text-red-500',
};

interface NotificationsPanelProps {
  onNavigate?: (url: string) => void;
}

export function NotificationsPanel({ onNavigate }: NotificationsPanelProps) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications =
    filter === 'all'
      ? notifications
      : notifications.filter((n) => !n.read);

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.actionUrl && onNavigate) {
      onNavigate(notification.actionUrl);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-muted/50 transition-colors group"
          title="Notificaciones"
        >
          <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 rounded-full text-xs flex items-center justify-center text-white font-semibold shadow-lg border-2 border-background animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[420px] p-0"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-lg">Notificaciones</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tienes {unreadCount} notificaciones sin leer
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-8"
            >
              <Check className="w-3 h-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        {/* Filters */}
        <Tabs
          defaultValue="all"
          value={filter}
          onValueChange={(v) => setFilter(v as 'all' | 'unread')}
          className="w-full"
        >
          <div className="px-4 pt-3 pb-2 border-b border-border/50">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="all" className="text-xs">
                Todas ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                Sin leer ({unreadCount})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Notifications List */}
          <TabsContent value={filter} className="m-0">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  {filter === 'unread'
                    ? '¡Todo al día! No tienes notificaciones sin leer'
                    : 'No tienes notificaciones'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="py-2">
                  {filteredNotifications.map((notification) => {
                    const Icon = notificationIcons[notification.type];
                    const colorClass = notificationColors[notification.type];

                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          'group relative px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-l-2',
                          notification.read
                            ? 'border-l-transparent'
                            : 'border-l-primary bg-primary/5'
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div
                            className={cn(
                              'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                              colorClass
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p
                                className={cn(
                                  'text-sm font-medium',
                                  notification.read
                                    ? 'text-muted-foreground'
                                    : 'text-foreground'
                                )}
                              >
                                {notification.title}
                              </p>
                              {notification.priority === 'high' && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-[10px] px-1.5 py-0',
                                    priorityColors[notification.priority]
                                  )}
                                >
                                  Alta
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                              {notification.message}
                            </p>

                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{notification.time}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  title="Marcar como leída"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                title="Eliminar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-border bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="w-full text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3 mr-2" />
              Eliminar todas las notificaciones
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

