import { ArrowDownRight, ArrowUpRight, LucideIcon } from "lucide-react";
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
  color?: "primary" | "success" | "warning" | "destructive" | "info";
  loading?: boolean;
}

const iconBgByColor: Record<NonNullable<MetricCardProps["color"]>, string> = {
  primary: "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20",
  success: "bg-success/10 text-success ring-1 ring-inset ring-success/20",
  warning: "bg-warning/10 text-warning ring-1 ring-inset ring-warning/25",
  destructive: "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20",
  info: "bg-info/10 text-info ring-1 ring-inset ring-info/20",
};

export function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  color = "primary",
  loading = false,
}: MetricCardProps) {
  const isIncrease = change?.type === "increase";
  const TrendIcon = isIncrease ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/95 p-5 shadow-elev-1 backdrop-blur-sm transition-all duration-base ease-standard hover:border-border/80 hover:shadow-elev-2 hover:-translate-y-px">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("flex size-9 items-center justify-center rounded-lg", iconBgByColor[color])}>
          <Icon className="size-[18px]" strokeWidth={2} />
        </div>

        {change && (
          <div
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
              isIncrease
                ? "bg-success/10 text-success ring-1 ring-inset ring-success/20"
                : "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20",
            )}
          >
            <TrendIcon className="size-3" strokeWidth={2.25} />
            <span className="tabular-nums">{Math.abs(change.value)}%</span>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>

        {loading ? (
          <div className="h-8 w-28 animate-pulse rounded-md bg-muted" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</p>
        )}

        {description && !loading && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
    </div>
  );
}
