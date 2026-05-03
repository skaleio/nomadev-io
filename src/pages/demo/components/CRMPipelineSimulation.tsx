import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  TrendingUp,
  CheckCircle,
  DollarSign,
  Activity,
  Pause,
  Play,
  Sparkles,
  PartyPopper,
  ArrowRight,
  Mail,
  Phone,
  Clock,
} from 'lucide-react';

type StageId = 'nuevo' | 'calificado' | 'propuesta' | 'negociacion' | 'cerrado';

interface SimLead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  value: number;
  source: string;
  stage: StageId;
  enteredStageAt: number;
  avatarGradient: string;
}

interface ActivityEntry {
  id: string;
  message: string;
  timestamp: number;
  type: 'progress' | 'closed' | 'new' | 'system';
}

const STAGE_ORDER: StageId[] = ['nuevo', 'calificado', 'propuesta', 'negociacion', 'cerrado'];

const STAGE_CONFIG: Record<StageId, { name: string; chipBg: string; chipText: string; ring: string; accent: string }> = {
  nuevo: {
    name: 'Nuevo',
    chipBg: 'bg-blue-500/15',
    chipText: 'text-blue-300',
    ring: 'ring-blue-500/30',
    accent: 'from-blue-500/20 to-blue-500/5',
  },
  calificado: {
    name: 'Calificado',
    chipBg: 'bg-amber-500/15',
    chipText: 'text-amber-300',
    ring: 'ring-amber-500/30',
    accent: 'from-amber-500/20 to-amber-500/5',
  },
  propuesta: {
    name: 'Propuesta',
    chipBg: 'bg-orange-500/15',
    chipText: 'text-orange-300',
    ring: 'ring-orange-500/30',
    accent: 'from-orange-500/20 to-orange-500/5',
  },
  negociacion: {
    name: 'Negociación',
    chipBg: 'bg-purple-500/15',
    chipText: 'text-purple-300',
    ring: 'ring-purple-500/30',
    accent: 'from-purple-500/20 to-purple-500/5',
  },
  cerrado: {
    name: 'Cerrado',
    chipBg: 'bg-emerald-500/15',
    chipText: 'text-emerald-300',
    ring: 'ring-emerald-500/30',
    accent: 'from-emerald-500/20 to-emerald-500/5',
  },
};

const AVATAR_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-indigo-500 to-purple-600',
  'from-sky-500 to-cyan-600',
  'from-lime-500 to-green-600',
];

const POOL_NEW_LEADS: Omit<SimLead, 'id' | 'stage' | 'enteredStageAt' | 'avatarGradient'>[] = [
  { name: 'María González', company: 'Boutique Aurora', email: 'maria@aurora.cl', phone: '+56 9 8945 1267', value: 1850000, source: 'Instagram Ads' },
  { name: 'Carlos Ruiz', company: 'TechStore Pro', email: 'carlos@techstore.cl', phone: '+56 9 7732 4521', value: 3200000, source: 'Google Ads' },
  { name: 'Ana Martínez', company: 'Beauty & Glow', email: 'ana@beautyglow.cl', phone: '+56 9 6612 8843', value: 2450000, source: 'Referido' },
  { name: 'Luis Pérez', company: 'Sports Center', email: 'luis@sportscenter.cl', phone: '+56 9 5523 7791', value: 1670000, source: 'Shopify' },
  { name: 'Sofía López', company: 'HomeDecor Co', email: 'sofia@homedecor.cl', phone: '+56 9 8821 4456', value: 2980000, source: 'WhatsApp' },
  { name: 'Miguel Torres', company: 'Outdoor Gear', email: 'miguel@outdoor.cl', phone: '+56 9 4493 7782', value: 4120000, source: 'TikTok Ads' },
  { name: 'Elena Vargas', company: 'Eco Boutique', email: 'elena@ecoboutique.cl', phone: '+56 9 3324 9981', value: 1420000, source: 'Web orgánico' },
  { name: 'Roberto Silva', company: 'Petlovers Store', email: 'roberto@petlovers.cl', phone: '+56 9 7715 2238', value: 2150000, source: 'Facebook Ads' },
  { name: 'Camila Reyes', company: 'Kids Wonder', email: 'camila@kidswonder.cl', phone: '+56 9 6604 3357', value: 1980000, source: 'Referido' },
  { name: 'Diego Herrera', company: 'GamerHub', email: 'diego@gamerhub.cl', phone: '+56 9 5587 1142', value: 5320000, source: 'YouTube Ads' },
  { name: 'Valentina Castro', company: 'Wellness Studio', email: 'val@wellness.cl', phone: '+56 9 4471 8866', value: 2640000, source: 'Email' },
  { name: 'Javier Morales', company: 'Auto Parts MX', email: 'javier@autoparts.cl', phone: '+56 9 8893 5520', value: 3870000, source: 'LinkedIn' },
  { name: 'Paula Núñez', company: 'Café Aroma', email: 'paula@cafearoma.cl', phone: '+56 9 7762 4480', value: 1280000, source: 'Instagram Ads' },
  { name: 'Andrés Ramírez', company: 'Fit Nutrition', email: 'andres@fitnutrition.cl', phone: '+56 9 5563 9907', value: 2390000, source: 'Shopify' },
  { name: 'Florencia Díaz', company: 'Joyas Luma', email: 'flor@joyasluma.cl', phone: '+56 9 4452 7783', value: 2870000, source: 'WhatsApp' },
];

const formatCLP = (value: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const relativeTime = (timestamp: number) => {
  const diff = Math.max(0, Date.now() - timestamp);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `hace ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `hace ${hours}h`;
};

const STAGE_ADVANCE_VERBS: Record<StageId, string> = {
  nuevo: 'entró al pipeline',
  calificado: 'fue calificado',
  propuesta: 'recibió propuesta',
  negociacion: 'inició negociación',
  cerrado: 'cerró ✓',
};

const buildInitialLeads = (): SimLead[] => {
  const distribution: Record<StageId, number> = {
    nuevo: 3,
    calificado: 3,
    propuesta: 2,
    negociacion: 2,
    cerrado: 2,
  };
  const now = Date.now();
  const leads: SimLead[] = [];
  let poolIndex = 0;
  let avatarIndex = 0;
  STAGE_ORDER.forEach((stage) => {
    for (let i = 0; i < distribution[stage]; i++) {
      const tpl = POOL_NEW_LEADS[poolIndex % POOL_NEW_LEADS.length];
      poolIndex++;
      leads.push({
        ...tpl,
        id: `lead-init-${stage}-${i}-${Math.random().toString(36).slice(2, 8)}`,
        stage,
        enteredStageAt: now - Math.floor(Math.random() * 90_000),
        avatarGradient: AVATAR_GRADIENTS[avatarIndex % AVATAR_GRADIENTS.length],
      });
      avatarIndex++;
    }
  });
  return leads;
};

interface CRMPipelineSimulationProps {
  intervalMs?: number;
}

export const CRMPipelineSimulation: React.FC<CRMPipelineSimulationProps> = ({ intervalMs = 1500 }) => {
  const [leads, setLeads] = useState<SimLead[]>(() => buildInitialLeads());
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [pulseStage, setPulseStage] = useState<StageId | null>(null);
  const [, forceTick] = useState(0);
  const newLeadCounter = useRef(0);
  const activityCounter = useRef(0);

  // Re-render cada 5s para refrescar "hace Xs" en las tarjetas
  useEffect(() => {
    const id = setInterval(() => forceTick((v) => v + 1), 5000);
    return () => clearInterval(id);
  }, []);

  // Motor de auto-progresión
  useEffect(() => {
    if (!isPlaying) return;

    const tick = () => {
      setLeads((prev) => {
        if (prev.length === 0) return prev;

        // Prioridad: avanzar leads que ya cerraron (sacarlos después de un tiempo)
        const now = Date.now();
        const closedLong = prev.find(
          (l) => l.stage === 'cerrado' && now - l.enteredStageAt > 2500,
        );

        if (closedLong) {
          // Remover el cerrado y crear uno nuevo
          const tpl = POOL_NEW_LEADS[Math.floor(Math.random() * POOL_NEW_LEADS.length)];
          newLeadCounter.current += 1;
          const newLead: SimLead = {
            ...tpl,
            id: `lead-${Date.now()}-${newLeadCounter.current}`,
            stage: 'nuevo',
            enteredStageAt: now,
            avatarGradient: AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)],
          };

          setActivity((a) =>
            [
              {
                id: `act-${++activityCounter.current}`,
                message: `${newLead.name} (${newLead.company}) ${STAGE_ADVANCE_VERBS.nuevo}`,
                timestamp: now,
                type: 'new' as const,
              },
              ...a,
            ].slice(0, 8),
          );

          setPulseStage('nuevo');
          setTimeout(() => setPulseStage(null), 800);

          return [...prev.filter((l) => l.id !== closedLong.id), newLead];
        }

        // Avanzar un lead aleatorio que no esté cerrado
        const advanceable = prev.filter((l) => l.stage !== 'cerrado');
        if (advanceable.length === 0) return prev;

        const target = advanceable[Math.floor(Math.random() * advanceable.length)];
        const currentIdx = STAGE_ORDER.indexOf(target.stage);
        const nextStage = STAGE_ORDER[currentIdx + 1];
        if (!nextStage) return prev;

        setActivity((a) =>
          [
            {
              id: `act-${++activityCounter.current}`,
              message: `${target.name} (${target.company}) ${STAGE_ADVANCE_VERBS[nextStage]}`,
              timestamp: now,
              type: (nextStage === 'cerrado' ? 'closed' : 'progress') as ActivityEntry['type'],
            },
            ...a,
          ].slice(0, 8),
        );

        setPulseStage(nextStage);
        setTimeout(() => setPulseStage(null), 800);

        return prev.map((l) =>
          l.id === target.id ? { ...l, stage: nextStage, enteredStageAt: now } : l,
        );
      });
    };

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [isPlaying, intervalMs]);

  // Activity inicial
  useEffect(() => {
    setActivity([
      {
        id: 'act-bootstrap',
        message: 'Pipeline cargado · 12 leads activos · sincronización en vivo con Shopify',
        timestamp: Date.now(),
        type: 'system',
      },
    ]);
  }, []);

  const stageGroups = useMemo(() => {
    const groups: Record<StageId, SimLead[]> = {
      nuevo: [],
      calificado: [],
      propuesta: [],
      negociacion: [],
      cerrado: [],
    };
    leads.forEach((l) => groups[l.stage].push(l));
    return groups;
  }, [leads]);

  const totals = useMemo(() => {
    const totalLeads = leads.length;
    const openValue = leads
      .filter((l) => l.stage !== 'cerrado')
      .reduce((sum, l) => sum + l.value, 0);
    const wonValue = leads
      .filter((l) => l.stage === 'cerrado')
      .reduce((sum, l) => sum + l.value, 0);
    const wonCount = leads.filter((l) => l.stage === 'cerrado').length;
    const conversionRate = totalLeads > 0 ? (wonCount / totalLeads) * 100 : 0;
    return { totalLeads, openValue, wonValue, conversionRate };
  }, [leads]);

  const initials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">CRM Pipeline</h1>
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Demo en vivo
            </Badge>
          </div>
          <p className="text-gray-400">
            Mira cómo cada lead avanza automáticamente por las etapas del pipeline en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsPlaying((p) => !p)}
            className="border-gray-700 hover:border-emerald-500/50"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pausar simulación
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Reanudar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-gray-400 text-xs font-medium">Leads activos</p>
                <p className="text-2xl font-bold text-white mt-1">{totals.totalLeads}</p>
              </div>
              <div className="rounded-lg bg-blue-500/15 p-2">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-gray-400 text-xs font-medium">Pipeline abierto</p>
                <p className="text-2xl font-bold text-white mt-1 truncate" title={formatCLP(totals.openValue)}>
                  {formatCLP(totals.openValue)}
                </p>
              </div>
              <div className="rounded-lg bg-sky-500/15 p-2">
                <TrendingUp className="w-5 h-5 text-sky-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-gray-400 text-xs font-medium">Valor ganado</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1 truncate" title={formatCLP(totals.wonValue)}>
                  {formatCLP(totals.wonValue)}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-500/15 p-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-gray-400 text-xs font-medium">Tasa de cierre</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {totals.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-lg bg-violet-500/15 p-2">
                <DollarSign className="w-5 h-5 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline */}
      <LayoutGroup>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {STAGE_ORDER.map((stageId) => {
            const stage = STAGE_CONFIG[stageId];
            const stageLeads = stageGroups[stageId];
            const stageValue = stageLeads.reduce((sum, l) => sum + l.value, 0);
            const isPulsing = pulseStage === stageId;
            return (
              <motion.div
                key={stageId}
                animate={isPulsing ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 0.6 }}
              >
                <Card
                  className={`bg-gray-900/40 border-gray-700/80 overflow-hidden relative transition-all ${
                    isPulsing ? `ring-2 ${stage.ring} shadow-lg` : ''
                  }`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stage.accent}`}
                    aria-hidden
                  />
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        {stageId === 'cerrado' && <PartyPopper className="w-4 h-4 text-emerald-400" />}
                        {stage.name}
                      </CardTitle>
                      <Badge className={`${stage.chipBg} ${stage.chipText} border-0 text-xs`}>
                        {stageLeads.length}
                      </Badge>
                    </div>
                    <p className="text-gray-500 text-xs mt-1 truncate" title={formatCLP(stageValue)}>
                      {formatCLP(stageValue)}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2 min-h-[180px]">
                    <AnimatePresence mode="popLayout">
                      {stageLeads.length === 0 ? (
                        <motion.div
                          key="empty"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center py-8 text-gray-600 text-xs"
                        >
                          Sin leads en esta etapa
                        </motion.div>
                      ) : (
                        stageLeads.map((lead) => (
                          <motion.div
                            key={lead.id}
                            layout
                            layoutId={lead.id}
                            initial={{ opacity: 0, scale: 0.9, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -8 }}
                            transition={{
                              layout: { type: 'spring', stiffness: 320, damping: 32 },
                              duration: 0.35,
                            }}
                            className="rounded-lg border border-gray-700/70 bg-gray-800/60 p-3 hover:bg-gray-800/90 hover:border-gray-600 cursor-default"
                          >
                            <div className="flex items-start gap-2.5 mb-2">
                              <div
                                className={`w-9 h-9 rounded-full bg-gradient-to-br ${lead.avatarGradient} flex items-center justify-center text-white font-bold text-xs shadow-lg flex-shrink-0`}
                              >
                                {initials(lead.name)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-white text-sm font-medium truncate" title={lead.name}>
                                  {lead.name}
                                </p>
                                <p className="text-gray-400 text-xs truncate" title={lead.company}>
                                  {lead.company}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-emerald-400 font-semibold">
                                {formatCLP(lead.value)}
                              </span>
                              <span className="text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {relativeTime(lead.enteredStageAt)}
                              </span>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </LayoutGroup>

      {/* Activity feed */}
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Actividad del pipeline
            <Badge className="bg-gray-800 text-gray-300 border border-gray-700 ml-2 text-[10px] font-normal">
              en vivo
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-hidden">
            <AnimatePresence initial={false}>
              {activity.map((entry) => {
                const accent =
                  entry.type === 'closed'
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : entry.type === 'new'
                      ? 'border-blue-500/40 bg-blue-500/5'
                      : entry.type === 'system'
                        ? 'border-gray-700 bg-gray-800/40'
                        : 'border-gray-700 bg-gray-800/30';
                const Icon =
                  entry.type === 'closed'
                    ? PartyPopper
                    : entry.type === 'new'
                      ? Sparkles
                      : entry.type === 'system'
                        ? Activity
                        : ArrowRight;
                const iconColor =
                  entry.type === 'closed'
                    ? 'text-emerald-400'
                    : entry.type === 'new'
                      ? 'text-blue-400'
                      : entry.type === 'system'
                        ? 'text-gray-400'
                        : 'text-amber-400';
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25 }}
                    className={`flex items-start gap-3 px-3 py-2 rounded-lg border ${accent}`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/90">{entry.message}</p>
                      <p className="text-xs text-gray-500">{relativeTime(entry.timestamp)}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CRMPipelineSimulation;
