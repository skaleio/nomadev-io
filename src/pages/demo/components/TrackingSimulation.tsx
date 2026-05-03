import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRel } from './KPI';

interface SimShipment {
  id: string;
  orderNumber: string;
  customer: string;
  city: string;
  carrier: string;
  status: 'preparing' | 'in_transit' | 'out_for_delivery' | 'delivered';
  progress: number;
  eta: string;
  updatedAt: number;
}

const buildShipments = (): SimShipment[] => [
  { id: 's1', orderNumber: '#NMD-21010', customer: 'María González', city: 'Santiago', carrier: 'Starken', status: 'preparing', progress: 15, eta: 'Hoy 18:30', updatedAt: Date.now() - 60_000 },
  { id: 's2', orderNumber: '#NMD-21008', customer: 'Carlos Ruiz', city: 'Valparaíso', carrier: 'Bluexpress', status: 'in_transit', progress: 55, eta: 'Mañana 10:00', updatedAt: Date.now() - 120_000 },
  { id: 's3', orderNumber: '#NMD-21005', customer: 'Ana Martínez', city: 'Concepción', carrier: 'Chilexpress', status: 'out_for_delivery', progress: 85, eta: 'Hoy 16:00', updatedAt: Date.now() - 30_000 },
  { id: 's4', orderNumber: '#NMD-21002', customer: 'Sofía López', city: 'Viña del Mar', carrier: 'Starken', status: 'delivered', progress: 100, eta: 'Entregado', updatedAt: Date.now() - 5 * 60 * 1000 },
];

const SHIPMENT_STATUS: Record<SimShipment['status'], { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  preparing: { label: 'Preparando', color: 'text-amber-400', icon: Package },
  in_transit: { label: 'En tránsito', color: 'text-blue-400', icon: Truck },
  out_for_delivery: { label: 'En reparto', color: 'text-violet-400', icon: Truck },
  delivered: { label: 'Entregado', color: 'text-emerald-400', icon: CheckCircle },
};

export const TrackingSimulation: React.FC = () => {
  const [shipments, setShipments] = useState<SimShipment[]>(() => buildShipments());
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick((v) => v + 1), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setShipments((prev) =>
        prev.map((s) => {
          if (s.status === 'delivered') return s;
          const newProgress = Math.min(100, s.progress + Math.floor(Math.random() * 10) + 3);
          let newStatus: SimShipment['status'] = s.status;
          if (newProgress >= 100) newStatus = 'delivered';
          else if (newProgress >= 80 && s.status === 'in_transit') newStatus = 'out_for_delivery';
          else if (newProgress >= 30 && s.status === 'preparing') newStatus = 'in_transit';
          return { ...s, progress: newProgress, status: newStatus, updatedAt: Date.now() };
        }),
      );
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">Seguimiento de Envíos</h1>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Demo en vivo
          </Badge>
        </div>
        <p className="text-gray-400">Cada pedido se trackea automáticamente y notifica a tu cliente por WhatsApp.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {shipments.map((s) => {
          const cfg = SHIPMENT_STATUS[s.status];
          const Icon = cfg.icon;
          return (
            <Card key={s.id} className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">{s.orderNumber}</p>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {s.customer} · {s.city} · {s.carrier}
                    </p>
                  </div>
                  <Badge className={`bg-gray-800 ${cfg.color} border border-gray-700 flex items-center gap-1`}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </Badge>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-gray-400">Progreso</span>
                    <span className="text-gray-300 font-medium">{s.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        s.status === 'delivered'
                          ? 'bg-emerald-500'
                          : s.status === 'out_for_delivery'
                            ? 'bg-violet-500'
                            : s.status === 'in_transit'
                              ? 'bg-blue-500'
                              : 'bg-amber-500',
                      )}
                      initial={false}
                      animate={{ width: `${s.progress}%` }}
                      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ETA: {s.eta}
                  </span>
                  <span>Actualizado {formatRel(s.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TrackingSimulation;
