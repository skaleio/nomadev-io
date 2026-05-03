import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Image as ImageIcon,
  PenTool,
  Wand2,
  Brain,
  Activity,
  CheckCircle,
  Loader2,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { KPI, formatRel } from './KPI';

type JobType = 'image' | 'caption' | 'reel' | 'reply';
type JobStatus = 'queued' | 'generating' | 'done';

interface AIJob {
  id: string;
  type: JobType;
  prompt: string;
  status: JobStatus;
  progress: number;
  createdAt: number;
  doneAt?: number;
  preview?: string;
}

const TYPE_META: Record<JobType, { label: string; icon: React.ComponentType<{ className?: string }>; gradient: string }> = {
  image: { label: 'Imagen producto', icon: ImageIcon, gradient: 'from-violet-500 to-fuchsia-500' },
  caption: { label: 'Caption Instagram', icon: PenTool, gradient: 'from-emerald-500 to-teal-500' },
  reel: { label: 'Guion para reel', icon: Wand2, gradient: 'from-amber-500 to-orange-500' },
  reply: { label: 'Respuesta IA cliente', icon: Brain, gradient: 'from-cyan-500 to-blue-500' },
};

const PROMPTS: Record<JobType, string[]> = {
  image: [
    'Polera oversize blanca sobre fondo arena, luz natural',
    'Audífonos wireless con bokeh dorado',
    'Mochila 25L outdoor en bosque',
  ],
  caption: [
    'Lanzamiento polera Aurora — tono cálido y aspiracional',
    'Promo 2x1 termo acero — copy directo y urgente',
    'Restock smartwatch — copy minimalista',
  ],
  reel: [
    'Reel 15s mostrando 3 outfits con la polera Aurora',
    'Reel 20s desempacando smartwatch con voz IA',
    'Reel 10s POV armando mochila para acampar',
  ],
  reply: [
    'Cliente pregunta talla M en stock — responder con disponibilidad',
    'Cliente pide cupón — derivar a flujo de fidelización',
    'Cliente reclamo despacho — empatía + ETA actualizada',
  ],
};

const PREVIEWS: Record<JobType, string[]> = {
  image: ['🏖️🤍 listo en HD', '🎧✨ banner para feed', '🥾🌲 ambiente natural'],
  caption: ['"Calma. Carácter. Aurora 🤍"', '"Hidratá tu día por menos."', '"Vuelve en negro mate. Sin avisos."'],
  reel: ['Hook + 3 outfits + CTA — 14s', 'Unboxing + voz IA + CTA — 19s', 'POV mochila — 11s'],
  reply: ['"¡Hola María! Sí, tenemos M en blanco…"', '"¡Te enviamos tu cupón ATARDECER10!"', '"Lamento la espera, tu pedido llega…"'],
};

let counter = 100;

const buildJob = (): AIJob => {
  const type = (['image', 'caption', 'reel', 'reply'] as JobType[])[Math.floor(Math.random() * 4)];
  const prompts = PROMPTS[type];
  return {
    id: `job-${counter++}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    prompt: prompts[Math.floor(Math.random() * prompts.length)],
    status: 'queued',
    progress: 0,
    createdAt: Date.now(),
  };
};

const buildInitial = (): AIJob[] => [
  { ...buildJob(), status: 'generating', progress: 35 },
  { ...buildJob(), status: 'generating', progress: 65 },
  { ...buildJob(), status: 'queued', progress: 0 },
];

export const StudioIASimulation: React.FC = () => {
  const [jobs, setJobs] = useState<AIJob[]>(() => buildInitial());
  const [stats, setStats] = useState({ generated: 1284, hoursSaved: 87, ctr: 4.6 });
  const tickRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current += 1;
      setJobs((prev) => {
        const next = prev.map((job) => {
          if (job.status === 'done') return job;
          if (job.status === 'queued') {
            return { ...job, status: 'generating' as JobStatus, progress: 12 };
          }
          const newProgress = Math.min(100, job.progress + Math.floor(15 + Math.random() * 18));
          if (newProgress >= 100) {
            const previews = PREVIEWS[job.type];
            setStats((s) => ({
              generated: s.generated + 1,
              hoursSaved: s.hoursSaved + (job.type === 'reel' ? 1 : 0),
              ctr: Math.min(7, s.ctr + 0.02),
            }));
            return {
              ...job,
              status: 'done' as JobStatus,
              progress: 100,
              doneAt: Date.now(),
              preview: previews[Math.floor(Math.random() * previews.length)],
            };
          }
          return { ...job, progress: newProgress };
        });

        const now = Date.now();
        const cleaned = next.filter((j) => j.status !== 'done' || (j.doneAt && now - j.doneAt < 5000));
        const active = cleaned.filter((j) => j.status !== 'done').length;
        if (active < 3 && tickRef.current % 2 === 0) {
          cleaned.push(buildJob());
        }
        return cleaned.slice(-6);
      });
    }, 1400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">Studio IA</h1>
          <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Demo en vivo
          </Badge>
        </div>
        <p className="text-gray-400">
          Imágenes, copys, reels y respuestas a clientes generados con IA — listos para publicar.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Activos generados" value={stats.generated.toLocaleString('es-CL')} icon={Sparkles} accent="violet" trend="+18.2%" />
        <KPI label="Horas ahorradas" value={`${stats.hoursSaved}h`} icon={Zap} accent="amber" />
        <KPI label="CTR promedio" value={`${stats.ctr.toFixed(1)}%`} icon={TrendingUp} accent="emerald" trend="+0.4pp" />
        <KPI label="Modelos activos" value="4" icon={Brain} accent="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-gray-900/50 border-gray-700 lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
              Generando ahora
              <Badge className="bg-gray-800 text-gray-300 border border-gray-700 ml-2 text-[10px] font-normal">
                {jobs.filter((j) => j.status !== 'done').length} en cola
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AnimatePresence initial={false} mode="popLayout">
                {jobs.map((job) => {
                  const meta = TYPE_META[job.type];
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={job.id}
                      layout
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ layout: { type: 'spring', stiffness: 320, damping: 30 }, duration: 0.25 }}
                      className="rounded-lg border border-gray-700/60 bg-gray-800/40 p-4"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white flex-shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm font-medium truncate">{meta.label}</p>
                          <p className="text-gray-400 text-xs truncate">{job.prompt}</p>
                        </div>
                        {job.status === 'done' ? (
                          <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Listo
                          </Badge>
                        ) : (
                          <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/40 flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            {job.status === 'queued' ? 'En cola' : `${job.progress}%`}
                          </Badge>
                        )}
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-900 overflow-hidden">
                        <motion.div
                          className={cn(
                            'h-full rounded-full',
                            job.status === 'done' ? 'bg-emerald-500' : 'bg-gradient-to-r from-violet-500 to-fuchsia-500',
                          )}
                          initial={false}
                          animate={{ width: `${job.progress}%` }}
                          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                        />
                      </div>
                      {job.status === 'done' && job.preview && (
                        <p className="text-emerald-300 text-xs mt-2 italic">→ {job.preview}</p>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Acciones rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(['image', 'caption', 'reel', 'reply'] as JobType[]).map((t) => {
              const meta = TYPE_META[t];
              const Icon = meta.icon;
              return (
                <Button
                  key={t}
                  variant="outline"
                  className="w-full justify-start border-gray-700 bg-gray-800/40 hover:bg-gray-800/80"
                  disabled
                >
                  <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white mr-3`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm text-gray-200">Generar {meta.label.toLowerCase()}</span>
                </Button>
              );
            })}
            <p className="text-[10px] text-gray-500 pt-2 text-center">
              En el demo los botones son ilustrativos — la IA corre sola.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudioIASimulation;
