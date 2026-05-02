import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export type KPIAccent = 'blue' | 'emerald' | 'violet' | 'orange' | 'amber' | 'rose' | 'cyan';

const ACCENT_CLASS: Record<KPIAccent, string> = {
  blue: 'bg-blue-500/15 text-blue-400',
  emerald: 'bg-emerald-500/15 text-emerald-400',
  violet: 'bg-violet-500/15 text-violet-400',
  orange: 'bg-orange-500/15 text-orange-400',
  amber: 'bg-amber-500/15 text-amber-400',
  rose: 'bg-rose-500/15 text-rose-400',
  cyan: 'bg-cyan-500/15 text-cyan-400',
};

export interface KPIProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: KPIAccent;
  trend?: string;
}

export const KPI: React.FC<KPIProps> = ({ label, value, icon: Icon, accent, trend }) => (
  <Card className="bg-gray-900/50 border-gray-700">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-gray-400 text-xs font-medium">{label}</p>
          <p className="text-2xl font-bold text-white mt-1 truncate" title={value}>
            {value}
          </p>
          {trend && <p className="text-emerald-400 text-xs mt-0.5">{trend} vs ayer</p>}
        </div>
        <div className={`rounded-lg ${ACCENT_CLASS[accent]} p-2`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const formatRel = (ts: number): string => {
  const diff = Math.max(0, Date.now() - ts);
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
};
