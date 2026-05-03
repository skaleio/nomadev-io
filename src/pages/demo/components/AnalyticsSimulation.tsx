import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, DollarSign, ShoppingBag, Eye, TrendingUp, Globe } from 'lucide-react';
import { KPI } from './KPI';

export const AnalyticsSimulation: React.FC = () => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const baseRevenue = 4_580_000;
  const baseOrders = 247;
  const baseConv = 3.2;

  const revenue = baseRevenue + tick * Math.floor(45_000 + Math.random() * 12_000);
  const orders = baseOrders + Math.floor(tick * 1.4);
  const conv = baseConv + Math.sin(tick / 5) * 0.4;
  const visitors = 8_452 + tick * Math.floor(15 + Math.random() * 12);

  const series = Array.from({ length: 12 }, (_, i) =>
    40 + Math.floor(Math.sin((tick + i) / 2) * 25 + Math.random() * 20),
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">Shopify Analytics</h1>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Demo en vivo
          </Badge>
        </div>
        <p className="text-gray-400">Métricas de tu tienda actualizadas en tiempo real.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Ingresos hoy" value={`$${(revenue / 1000).toFixed(0)}K CLP`} icon={DollarSign} accent="emerald" trend="+12.4%" />
        <KPI label="Pedidos" value={orders.toString()} icon={ShoppingBag} accent="blue" trend="+8.7%" />
        <KPI label="Visitantes" value={visitors.toLocaleString('es-CL')} icon={Eye} accent="violet" trend="+23.1%" />
        <KPI label="Conversión" value={`${conv.toFixed(2)}%`} icon={TrendingUp} accent="orange" trend="+1.8%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-gray-900/50 border-gray-700 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Ventas últimas 12 horas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1.5">
              {series.map((v, i) => (
                <motion.div
                  key={i}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-emerald-600/40 to-emerald-400"
                  initial={false}
                  animate={{ height: `${v}%` }}
                  transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-2">
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i}>{`${(new Date().getHours() - 11 + i + 24) % 24}h`}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              Top fuentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Instagram Ads', value: 38, color: 'bg-pink-500' },
              { label: 'Google Ads', value: 27, color: 'bg-blue-500' },
              { label: 'Web orgánico', value: 19, color: 'bg-cyan-500' },
              { label: 'WhatsApp', value: 11, color: 'bg-emerald-500' },
              { label: 'Otros', value: 5, color: 'bg-gray-500' },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-300">{s.label}</span>
                  <span className="text-gray-500">{s.value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${s.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.value}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsSimulation;
