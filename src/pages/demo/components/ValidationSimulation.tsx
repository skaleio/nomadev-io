import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Activity,
  Users,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { KPI, formatRel } from './KPI';

type ValidationStatus = 'checking' | 'approved' | 'rejected' | 'risk';

interface ValidationCheck {
  key: 'email' | 'phone' | 'document' | 'address';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  state: 'pending' | 'pass' | 'fail';
  detail?: string;
}

interface ValidationItem {
  id: string;
  customer: string;
  initials: string;
  gradient: string;
  email: string;
  phone: string;
  city: string;
  riskScore: number;
  status: ValidationStatus;
  checks: ValidationCheck[];
  reason?: string;
  receivedAt: number;
  resolvedAt?: number;
}

const NAMES = [
  'María González', 'Carlos Ruiz', 'Ana Martínez', 'Luis Pérez', 'Camila Reyes',
  'Tomás Vidal', 'Florencia Díaz', 'Andrés Ramírez', 'Constanza Pizarro', 'Joaquín Pino',
];
const CITIES = ['Santiago', 'Viña del Mar', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco'];
const GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
];
const REJECT_REASONS = [
  'Email temporal detectado',
  'Teléfono inválido',
  'Dirección no encontrada',
  'Documento no coincide',
  'IP de alto riesgo',
];
const RISK_REASONS = [
  'Dirección parcialmente verificada',
  'Email registrado hace <24h',
  'Múltiples intentos previos',
];

const initials = (name: string): string =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

let counter = 100;

const buildItem = (override?: Partial<ValidationItem>): ValidationItem => {
  const name = override?.customer ?? NAMES[Math.floor(Math.random() * NAMES.length)];
  const city = override?.city ?? CITIES[Math.floor(Math.random() * CITIES.length)];
  const gradient = override?.gradient ?? GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
  const baseEmail = name.toLowerCase().replace(/\s+/g, '.').replace(/[áéíóúñ]/g, (c) => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n' }[c] ?? c));
  return {
    id: `val-${counter++}-${Math.random().toString(36).slice(2, 6)}`,
    customer: name,
    initials: initials(name),
    gradient,
    email: `${baseEmail}@gmail.com`,
    phone: `+569 ${Math.floor(10000000 + Math.random() * 89999999)}`,
    city,
    riskScore: Math.floor(Math.random() * 100),
    status: 'checking',
    receivedAt: Date.now(),
    checks: [
      { key: 'email', label: 'Email', icon: Mail, state: 'pending' },
      { key: 'phone', label: 'Teléfono', icon: Phone, state: 'pending' },
      { key: 'document', label: 'RUT', icon: CreditCard, state: 'pending' },
      { key: 'address', label: 'Dirección', icon: MapPin, state: 'pending' },
    ],
    ...override,
  };
};

const buildInitial = (): ValidationItem[] => [
  buildItem({ customer: 'María González', city: 'Santiago' }),
  buildItem({ customer: 'Carlos Ruiz', city: 'Valparaíso' }),
  buildItem({ customer: 'Ana Martínez', city: 'Concepción' }),
];

const STATUS_META: Record<ValidationStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  checking: { label: 'Verificando…', color: 'text-blue-300 bg-blue-500/10 border-blue-500/40', icon: Loader2 },
  approved: { label: 'Aprobado', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/40', icon: CheckCircle },
  rejected: { label: 'Rechazado', color: 'text-rose-300 bg-rose-500/10 border-rose-500/40', icon: XCircle },
  risk: { label: 'Revisión manual', color: 'text-amber-300 bg-amber-500/10 border-amber-500/40', icon: AlertTriangle },
};

interface ValidationSimulationProps {
  intervalMs?: number;
}

export const ValidationSimulation: React.FC<ValidationSimulationProps> = ({ intervalMs = 1700 }) => {
  const [items, setItems] = useState<ValidationItem[]>(() => buildInitial());
  const [stats, setStats] = useState({ approved: 2814, rejected: 23, manual: 18, today: 156 });
  const tickRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current += 1;
      setItems((prev) => {
        if (prev.length === 0) return prev;
        const next = prev.map((item) => {
          if (item.status !== 'checking') return item;

          const pendingIdx = item.checks.findIndex((c) => c.state === 'pending');
          if (pendingIdx === -1) {
            const failed = item.checks.filter((c) => c.state === 'fail');
            const decided: ValidationStatus =
              failed.length === 0 ? 'approved'
              : failed.length === 1 ? 'risk'
              : 'rejected';
            const reason =
              decided === 'rejected' ? REJECT_REASONS[Math.floor(Math.random() * REJECT_REASONS.length)]
              : decided === 'risk' ? RISK_REASONS[Math.floor(Math.random() * RISK_REASONS.length)]
              : undefined;
            setStats((s) => ({
              ...s,
              approved: decided === 'approved' ? s.approved + 1 : s.approved,
              rejected: decided === 'rejected' ? s.rejected + 1 : s.rejected,
              manual: decided === 'risk' ? s.manual + 1 : s.manual,
              today: s.today + 1,
            }));
            return { ...item, status: decided, reason, resolvedAt: Date.now() };
          }

          // 88% pass rate per check
          const passes = Math.random() > 0.12;
          const updatedChecks = [...item.checks];
          const c = updatedChecks[pendingIdx];
          updatedChecks[pendingIdx] = {
            ...c,
            state: passes ? 'pass' : 'fail',
            detail: passes ? 'OK' : c.key === 'email' ? 'Bloqueado' : c.key === 'phone' ? 'No responde' : 'Mismatch',
          };
          return { ...item, checks: updatedChecks };
        });

        // Remove resolved items older than 4s and add new ones to keep flow alive
        const now = Date.now();
        const cleaned = next.filter((i) => i.status === 'checking' || (i.resolvedAt && now - i.resolvedAt < 4500));
        if (cleaned.filter((i) => i.status === 'checking').length < 3 && tickRef.current % 2 === 0) {
          cleaned.unshift(buildItem());
        }
        return cleaned.slice(0, 6);
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  const checking = useMemo(() => items.filter((i) => i.status === 'checking'), [items]);
  const recent = useMemo(() => items.filter((i) => i.status !== 'checking').slice(0, 4), [items]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">Validador de Clientes</h1>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Demo en vivo
          </Badge>
        </div>
        <p className="text-gray-400">
          Mira cómo se validan email, teléfono, RUT y dirección de cada cliente automáticamente, en tiempo real.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Aprobados (mes)" value={stats.approved.toLocaleString('es-CL')} icon={Shield} accent="emerald" trend="+15.3%" />
        <KPI label="Rechazos / fraude" value={stats.rejected.toString()} icon={AlertTriangle} accent="rose" />
        <KPI label="Revisión manual" value={stats.manual.toString()} icon={Users} accent="amber" />
        <KPI label="Validaciones hoy" value={stats.today.toString()} icon={Activity} accent="blue" trend="+12.7%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-gray-900/50 border-gray-700 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              Verificando ahora
              <Badge className="bg-gray-800 text-gray-300 border border-gray-700 ml-2 text-[10px] font-normal">
                {checking.length} en cola
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AnimatePresence initial={false} mode="popLayout">
                {checking.length === 0 && (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-gray-500 text-sm py-6 text-center"
                  >
                    Sin clientes en cola — esperando próximo registro…
                  </motion.p>
                )}
                {checking.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ layout: { type: 'spring', stiffness: 320, damping: 30 }, duration: 0.25 }}
                    className="rounded-lg border border-gray-700/60 bg-gray-800/40 p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                        {item.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-medium truncate">{item.customer}</p>
                        <p className="text-gray-400 text-xs truncate">{item.email} · {item.city}</p>
                      </div>
                      <Badge className={cn('border flex items-center gap-1', STATUS_META.checking.color)}>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {STATUS_META.checking.label}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {item.checks.map((c) => {
                        const Icon = c.icon;
                        return (
                          <div
                            key={c.key}
                            className={cn(
                              'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors',
                              c.state === 'pending' && 'border-gray-700 bg-gray-900/60 text-gray-400',
                              c.state === 'pass' && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
                              c.state === 'fail' && 'border-rose-500/40 bg-rose-500/10 text-rose-300',
                            )}
                          >
                            {c.state === 'pending' ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : c.state === 'pass' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            <Icon className="w-3 h-3 opacity-60" />
                            <span className="truncate">{c.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Resueltos recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <AnimatePresence initial={false} mode="popLayout">
                {recent.length === 0 && (
                  <p className="text-gray-500 text-sm py-4 text-center">Aún no hay validaciones cerradas.</p>
                )}
                {recent.map((item) => {
                  const meta = STATUS_META[item.status];
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-start gap-3 p-2.5 rounded-lg border border-gray-700/60 bg-gray-800/30"
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0`}>
                        {item.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{item.customer}</p>
                        <p className="text-gray-500 text-[10px] truncate">
                          {item.reason ?? 'Verificación completa'} · {formatRel(item.resolvedAt ?? item.receivedAt)}
                        </p>
                      </div>
                      <Badge className={cn('border flex items-center gap-1 text-[10px] py-0 h-5 flex-shrink-0', meta.color)}>
                        <Icon className="w-2.5 h-2.5" />
                        {meta.label}
                      </Badge>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ValidationSimulation;
