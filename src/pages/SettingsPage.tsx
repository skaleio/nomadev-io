import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Database,
  Users,
  Package,
  CheckCircle,
  Wifi,
  User,
  LogOut,
  Activity,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const fullName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.firstName || user?.email?.split("@")[0] || "Usuario";

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Configuración</h1>
          <p className="text-muted-foreground">
            Estado de tu cuenta y de los servicios activos en NOMADEV.IO
          </p>
        </div>

        <Card className="glass-card p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                <Wifi className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <Package className="w-6 h-6 text-emerald-600" />
                <div>
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">
                    Importador Dropi
                  </h4>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    Activo
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <Activity className="w-6 h-6 text-emerald-600" />
                <div>
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">
                    Métricas COD
                  </h4>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    Funcionando
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <Database className="w-6 h-6 text-emerald-600" />
                <div>
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-200">
                    Base de datos
                  </h4>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    Online
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Información de la cuenta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-sm text-muted-foreground">
                    Nombre completo
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    readOnly
                    className="mt-1 bg-muted/50 font-semibold"
                  />
                </div>
                <div>
                  <Label htmlFor="userId" className="text-sm text-muted-foreground">
                    ID de Usuario
                  </Label>
                  <Input
                    id="userId"
                    value={user?.id ?? ""}
                    readOnly
                    className="mt-1 bg-muted/50 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={user?.email ?? ""}
                    readOnly
                    className="mt-1 bg-muted/50"
                  />
                </div>
                <div>
                  <Label htmlFor="status" className="text-sm text-muted-foreground">
                    Estado
                  </Label>
                  <div className="mt-1">
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Activo
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6">
              <Button variant="outline" onClick={() => navigate("/profile")}>
                <User className="w-4 h-4 mr-2" />
                Editar perfil
              </Button>
              <Button variant="outline" onClick={() => navigate("/orders")}>
                <Package className="w-4 h-4 mr-2" />
                Ir a Gestión de Pedidos
              </Button>
              <Button
                variant="outline"
                className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                onClick={() => void handleLogout()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card p-6 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                <Settings className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              Próximamente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pronto vas a poder conectar Shopify, WhatsApp Business y administrar
              integraciones desde aquí. Mientras tanto, el panel se enfoca en lo que ya
              está listo: importación Dropi y métricas COD.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
