import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "pending" | "error" | "success" | "warning";
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const getStatusClasses = () => {
    switch (status) {
      case "active":
      case "success":
        return "status-success";
      case "warning":
        return "status-warning";
      case "error":
        return "status-error";
      case "pending":
        return "bg-muted/20 text-muted-foreground border border-muted";
      default:
        return "bg-muted/20 text-muted-foreground border border-muted";
    }
  };

  return (
    <span className={cn("status-indicator", getStatusClasses(), className)}>
      {children}
    </span>
  );
}