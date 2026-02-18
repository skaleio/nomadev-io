import React from 'react';
import { AlertTriangle, Bell, X, Package, ArrowRight, Clock } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';

interface NotificationBannerProps {
  orderNumber: string;
  customerName: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  onDismiss: () => void;
  onViewOrder: () => void;
}

export function NotificationBanner({
  orderNumber,
  customerName,
  reason,
  priority,
  onDismiss,
  onViewOrder
}: NotificationBannerProps) {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent': 
        return {
          bg: 'bg-black',
          border: 'border-gray-800',
          accent: 'bg-gradient-to-r from-red-400 to-red-500',
          text: 'text-red-100',
          icon: <AlertTriangle className="w-3 h-3 text-red-400" />,
          badge: 'bg-gradient-to-r from-red-900/40 to-red-800/40 text-red-200 border border-red-500/20'
        };
      case 'high': 
        return {
          bg: 'bg-black',
          border: 'border-gray-800',
          accent: 'bg-gradient-to-r from-orange-400 to-orange-500',
          text: 'text-orange-100',
          icon: <Bell className="w-3 h-3 text-orange-400" />,
          badge: 'bg-gradient-to-r from-orange-900/40 to-orange-800/40 text-orange-200 border border-orange-500/20'
        };
      case 'medium': 
        return {
          bg: 'bg-black',
          border: 'border-gray-800',
          accent: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
          text: 'text-yellow-100',
          icon: <Clock className="w-3 h-3 text-yellow-400" />,
          badge: 'bg-gradient-to-r from-yellow-900/40 to-yellow-800/40 text-yellow-200 border border-yellow-500/20'
        };
      case 'low': 
        return {
          bg: 'bg-black',
          border: 'border-gray-800',
          accent: 'bg-gradient-to-r from-green-400 to-green-500',
          text: 'text-green-100',
          icon: <Bell className="w-3 h-3 text-green-400" />,
          badge: 'bg-gradient-to-r from-green-900/40 to-green-800/40 text-green-200 border border-green-500/20'
        };
      default: 
        return {
          bg: 'bg-black',
          border: 'border-gray-800',
          accent: 'bg-gradient-to-r from-gray-400 to-gray-500',
          text: 'text-gray-100',
          icon: <Bell className="w-3 h-3 text-gray-400" />,
          badge: 'bg-gradient-to-r from-gray-800/40 to-gray-700/40 text-gray-200 border border-gray-500/20'
        };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <div className={`w-72 ${config.bg} backdrop-blur-sm rounded-2xl shadow-xl animate-slide-in-up`}>
      <div className="p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {config.icon}
            <span className="text-xs font-medium text-muted-foreground">Validación</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="h-5 w-5 p-0 hover:bg-gray-700/50 rounded-full"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-1.5">
          {/* Order info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Package className="w-3 h-3 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">#{orderNumber}</span>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.badge} backdrop-blur-sm shadow-sm border border-white/10`}>
              <div className={`w-2 h-2 rounded-full ${config.accent} shadow-sm`}></div>
              <span className="uppercase tracking-wide">{priority}</span>
            </div>
          </div>

          {/* Customer name */}
          <div>
            <p className="text-sm font-medium text-foreground truncate">{customerName}</p>
          </div>

          {/* Reason */}
          <div className="p-1.5 bg-gray-800/50 rounded-lg border border-gray-700/30">
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{reason}</p>
          </div>

          {/* Action button */}
          <Button
            onClick={onViewOrder}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-6 text-xs font-medium"
          >
            Ver Pedido
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
