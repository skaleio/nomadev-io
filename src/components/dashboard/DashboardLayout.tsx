import { NewDashboardLayout } from "./NewDashboardLayout";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return <NewDashboardLayout>{children}</NewDashboardLayout>;
}