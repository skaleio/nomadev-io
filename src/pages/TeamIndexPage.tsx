import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function TeamIndexPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Equipo</h1>
            <p className="text-muted-foreground">
              Miembros del espacio de trabajo vinculado a tu cuenta.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/team/invite/email">
                <UserPlus className="w-4 h-4 mr-2" />
                Invitar
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/team/new">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo equipo
              </Link>
            </Button>
          </div>
        </div>

        <Card className="glass-card p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Users className="w-5 h-5 text-primary" />
              </div>
              Miembros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {(user?.email?.charAt(0) ?? "U").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email ?? "Usuario"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground shrink-0">
                Propietario
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              La gestión multiusuario (roles, invitaciones por email y enlaces) se
              conectará al backend cuando el módulo de equipos esté activo. Mientras tanto
              puedes preparar invitaciones desde las opciones de abajo.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
