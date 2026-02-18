import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Users, Target, TrendingUp, Award } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

export default function LeadsPage() {
  const leadsMetrics = [
    {
      title: "Leads Totales",
      value: "0",
      change: { value: 0, type: "increase" as const },
      icon: Users,
      color: "primary" as const
    },
    {
      title: "Tasa Conversión",
      value: "0%",
      change: { value: 0, type: "increase" as const },
      icon: Target,
      color: "success" as const
    },
    {
      title: "Leads Calientes",
      value: "0",
      change: { value: 0, type: "increase" as const },
      icon: TrendingUp,
      color: "warning" as const
    },
    {
      title: "Convertidos Hoy",
      value: "0",
      change: { value: 0, type: "increase" as const },
      icon: Award,
      color: "success" as const
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Gestor de Leads
          </h1>
          <p className="text-muted-foreground">
            Pipeline de leads con scoring automático y seguimiento
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {leadsMetrics.map((metric, index) => (
            <div key={metric.title} className="animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
              <MetricCard {...metric} />
            </div>
          ))}
        </div>

        <Card className="glass-card p-6">
          <h3 className="text-lg font-semibold mb-4">Pipeline de Leads</h3>
          <div className="bg-muted/10 rounded-lg border border-dashed border-border p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground mb-2">Sistema de Gestión de Leads</p>
            <StatusBadge status="pending">Requiere integración con Supabase</StatusBadge>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}