import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Sparkles, MapPin, TrendingUp, Filter, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KPI, formatRel } from './KPI';

interface SimNewLead {
  id: string;
  name: string;
  source: 'Instagram Ads' | 'Google Ads' | 'WhatsApp' | 'Web orgánico' | 'Facebook Ads' | 'TikTok Ads';
  city: string;
  score: number;
  product: string;
  createdAt: number;
}

const LEAD_NAMES = [
  'Camila Reyes', 'Andrés Ramírez', 'Florencia Díaz', 'Tomás Vidal', 'Ignacia Soto',
  'Benjamín Olave', 'Valentina Castro', 'Joaquín Pino', 'Constanza Pizarro', 'Matías Aravena',
];
const LEAD_SOURCES: SimNewLead['source'][] = ['Instagram Ads', 'Google Ads', 'WhatsApp', 'Web orgánico', 'Facebook Ads', 'TikTok Ads'];
const LEAD_CITIES = ['Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Temuco', 'Antofagasta', 'Viña del Mar'];
const LEAD_PRODUCTS = ['Polera Premium', 'Audífonos Wireless', 'Mochila 25L', 'Termo Acero', 'Smartwatch'];

const buildLead = (id: number): SimNewLead => ({
  id: `nl-${id}-${Math.random().toString(36).slice(2, 8)}`,
  name: LEAD_NAMES[Math.floor(Math.random() * LEAD_NAMES.length)],
  source: LEAD_SOURCES[Math.floor(Math.random() * LEAD_SOURCES.length)],
  city: LEAD_CITIES[Math.floor(Math.random() * LEAD_CITIES.length)],
  score: 50 + Math.floor(Math.random() * 50),
  product: LEAD_PRODUCTS[Math.floor(Math.random() * LEAD_PRODUCTS.length)],
  createdAt: Date.now(),
});

const SOURCE_COLOR: Record<SimNewLead['source'], string> = {
  'Instagram Ads': 'from-pink-500 to-rose-500',
  'Google Ads': 'from-blue-500 to-sky-500',
  'WhatsApp': 'from-emerald-500 to-green-500',
  'Web orgánico': 'from-cyan-500 to-teal-500',
  'Facebook Ads': 'from-blue-600 to-indigo-500',
  'TikTok Ads': 'from-gray-700 to-gray-900',
};

export const LeadsSimulation: React.FC = () => {
  const [leads, setLeads] = useState<SimNewLead[]>(() =>
    Array.from({ length: 6 }, (_, i) => ({
      ...buildLead(i),
      createdAt: Date.now() - i * 45_000,
    })),
  );
  const counterRef = useRef(100);
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick((v) => v + 1), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setLeads((prev) => {
        const newLead = buildLead(counterRef.current++);
        return [newLead, ...prev].slice(0, 12);
      });
    }, 5500);
    return () => clearInterval(id);
  }, []);

  const stats = {
    total: leads.length,
    hot: leads.filter((l) => l.score >= 80).length,
    today: leads.length,
    bySource: leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.source] = (acc[l.source] ?? 0) + 1;
      return acc;
    }, {}),
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">Gestor de Leads</h1>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Demo en vivo
          </Badge>
        </div>
        <p className="text-gray-400">
          Mira cómo entran nuevos leads desde tus campañas y se califican automáticamente.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Leads capturados" value={stats.total.toString()} icon={Users} accent="blue" />
        <KPI label="Leads calientes" value={stats.hot.toString()} icon={Zap} accent="orange" />
        <KPI label="Top fuente" value={Object.entries(stats.bySource).sort(([, a], [, b]) => b - a)[0]?.[0] ?? '—'} icon={Filter} accent="violet" />
        <KPI label="Score promedio" value={`${Math.round(leads.reduce((s, l) => s + l.score, 0) / Math.max(1, leads.length))}/100`} icon={TrendingUp} accent="emerald" />
      </div>

      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Leads entrantes
            <Badge className="bg-gray-800 text-gray-300 border border-gray-700 ml-2 text-[10px] font-normal">
              actualizado en vivo
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <AnimatePresence initial={false} mode="popLayout">
              {leads.map((lead) => (
                <motion.div
                  key={lead.id}
                  layout
                  initial={{ opacity: 0, y: -10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ layout: { type: 'spring', stiffness: 320, damping: 30 }, duration: 0.3 }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-700/60 bg-gray-800/50"
                >
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${SOURCE_COLOR[lead.source]} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                    {lead.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium truncate">{lead.name}</p>
                      <Badge className="bg-gray-700 text-gray-300 border-0 text-[10px]">{lead.source}</Badge>
                    </div>
                    <p className="text-gray-400 text-xs truncate">
                      <MapPin className="w-3 h-3 inline mr-1 -mt-0.5" />
                      {lead.city} · interés en {lead.product}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <span
                        className={cn(
                          'text-sm font-bold',
                          lead.score >= 80 ? 'text-emerald-400' : lead.score >= 65 ? 'text-amber-400' : 'text-gray-400',
                        )}
                      >
                        {lead.score}
                      </span>
                      <span className="text-gray-500 text-xs">/100</span>
                    </div>
                    <p className="text-gray-500 text-[10px]">{formatRel(lead.createdAt)}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadsSimulation;
