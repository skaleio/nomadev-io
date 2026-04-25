import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Receipt, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function BillingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Facturación</h1>
          <p className="text-muted-foreground">
            Plan, uso y datos de facturación asociados a{" "}
            <span className="font-medium text-foreground">{user?.email}</span>
          </p>
        </div>

        <Card className="glass-card p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              Plan actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">NOMADEV — Starter</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Incluye dashboard, pedidos y CRM. Los módulos con candado se activan por
                  beta o al pasar de plan.
                </p>
              </div>
              <Badge variant="soft">Activo</Badge>
            </div>
            <p className="text-xs text-muted-foreground border-t border-border pt-4">
              El cobro recurrente y el portal del cliente (Stripe u otro PSP) se conectará
              aquí cuando esté habilitado en tu espacio de trabajo.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card p-6 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-lg bg-muted border border-border">
                <Receipt className="w-5 h-5 text-muted-foreground" />
              </div>
              Facturas y método de pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Aún no hay facturas emitidas para esta cuenta. Cuando el billing esté
              conectado, verás el historial y podrás actualizar la tarjeta o método de pago.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
              Ir a configuración
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
