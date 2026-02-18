import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon: LucideIcon;
  description?: string;
  color?: "primary" | "success" | "warning" | "destructive";
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  color = "primary",
  loading = false
}: MetricCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "destructive":
        return "text-destructive";
      default:
        return "text-primary";
    }
  };

  const getChangeClasses = () => {
    if (!change) return "";
    return change.type === "increase" 
      ? "text-success" 
      : "text-destructive";
  };

  return (
    <div className="metric-card p-6 rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "p-3 rounded-lg bg-gradient-to-br",
          color === "success" && "from-success/10 to-success/5 border border-success/20",
          color === "warning" && "from-warning/10 to-warning/5 border border-warning/20",
          color === "destructive" && "from-destructive/10 to-destructive/5 border border-destructive/20",
          color === "primary" && "from-primary/10 to-primary/5 border border-primary/20"
        )}>
          <Icon className={cn("w-6 h-6", getColorClasses())} />
        </div>
        
        {change && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
            getChangeClasses(),
            change.type === "increase" && "bg-success/10",
            change.type === "decrease" && "bg-destructive/10"
          )}>
            <span>{change.type === "increase" ? "+" : "-"}{Math.abs(change.value)}%</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-24"></div>
          </div>
        ) : (
          <p className="text-3xl font-bold text-foreground">{value}</p>
        )}
        
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}