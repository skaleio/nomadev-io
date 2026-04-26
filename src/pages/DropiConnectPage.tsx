import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Truck, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { dropiLogin, saveDropiConfig } from "@/lib/dropi-service";

export default function DropiConnectPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [useTest, setUseTest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleConnect = async () => {
    if (!email.trim() || !password) {
      setError("Ingresa email y contraseña de tu cuenta Dropi");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { token, baseUrl } = await dropiLogin(email.trim(), password, useTest);
      await saveDropiConfig(token, baseUrl, email.trim());
      setSuccess(true);
      setTimeout(() => navigate("/dropi"), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al conectar con Dropi";
      if (msg.toLowerCase().includes("access denied")) {
        setError("Acceso denegado. Revisa email y contraseña. Si usas cuenta de pruebas, marca «Usar entorno de pruebas».");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh] p-4">
          <Card className="w-full max-w-md bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Conexión exitosa</h2>
                <p className="text-muted-foreground mb-4">Dropi conectado. Redirigiendo...</p>
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="flex items-center justify-center min-h-[50vh] p-4">
      <Card className="w-full max-w-md bg-card border-border backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-warning rounded-full flex items-center justify-center">
              <Truck className="w-8 h-8 text-warning-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Conectar Dropi</CardTitle>
          <p className="text-muted-foreground text-sm">
            Usa las credenciales de tu cuenta Dropi para logística y envíos
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="dropi-email" className="text-foreground font-medium">
              Email
            </Label>
            <Input
              id="dropi-email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dropi-password" className="text-foreground font-medium">
              Contraseña
            </Label>
            <Input
              id="dropi-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dropi-test"
              checked={useTest}
              onCheckedChange={(c) => setUseTest(!!c)}
              disabled={loading}
            />
            <Label htmlFor="dropi-test" className="text-muted-foreground text-sm cursor-pointer">
              Usar entorno de pruebas (test-api.dropi.co)
            </Label>
          </div>
          <Button
            onClick={handleConnect}
            disabled={loading || !email.trim() || !password}
            className="w-full font-semibold py-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Truck className="w-5 h-5 mr-2" />
                Conectar Dropi
              </>
            )}
          </Button>
          <Collapsible className="rounded-lg border border-warning/30 bg-warning/5">
            <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-warning hover:text-warning/80">
              <span className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                ¿No tienes acceso a la API? / Acceso denegado
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-3 pb-3 pt-0 text-xs text-muted-foreground space-y-2">
              <p>Si Dropi devuelve &quot;Access denied&quot;, suele ser porque la cuenta aún no tiene habilitado el acceso por API. Puedes hacer esto mientras tanto:</p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>En la web de Dropi, entra a <strong>Mis Integraciones</strong> y completa el campo <strong>Nombre de Tienda</strong> (y guarda). A veces es necesario para que den el acceso.</li>
                <li>Contacta al soporte de Dropi y pide que activen el <strong>acceso API</strong> o integración para tu cuenta.</li>
                <li>Cuando te lo activen, vuelve aquí y pulsa &quot;Conectar Dropi&quot; con el mismo email y contraseña.</li>
              </ul>
            </CollapsibleContent>
          </Collapsible>
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/dropi")}
              className="text-muted-foreground hover:text-foreground"
            >
              ← Volver a Dropi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}
