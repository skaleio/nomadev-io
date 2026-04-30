import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";

const AUTH_TIMEOUT_MS = 8000;

export default function AuthSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Soporte legacy del flujo Shopify connect
  const shop = searchParams.get("shop");
  const connected = searchParams.get("connected");
  const isShopifyConnect = connected === "true" && !!shop;

  // Mensaje de error de Supabase (e.g. email link expirado, redirect_to inválido)
  const supabaseError =
    searchParams.get("error_description") || searchParams.get("error");

  useEffect(() => {
    if (supabaseError) {
      setError(decodeURIComponent(supabaseError));
      return;
    }

    // Caso 1: Shopify OAuth callback — mantener comportamiento previo
    if (isShopifyConnect) {
      const t = setTimeout(() => {
        navigate("/shopify", {
          replace: true,
          state: { connectionSuccess: true, shop },
        });
      }, 1500);
      return () => clearTimeout(t);
    }

    // Caso 2: verificación de email completada → Supabase ya creó la sesión
    if (isAuthenticated && user) {
      const t = setTimeout(() => {
        navigate("/onboarding", { replace: true });
      }, 1200);
      return () => clearTimeout(t);
    }

    // Caso 3: timeout esperando sesión
    if (!isLoading && !isAuthenticated) {
      const t = setTimeout(() => {
        setError(
          "No pudimos verificar la sesión. Intentá iniciar sesión manualmente."
        );
      }, AUTH_TIMEOUT_MS);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, user, isLoading, isShopifyConnect, shop, navigate, supabaseError]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-destructive/15 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              No pudimos verificar tu cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Ir a iniciar sesión
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/register")}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              Volver a registrarme
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const title = isShopifyConnect ? "¡Conexión exitosa!" : "¡Cuenta verificada!";
  const subtitle = isShopifyConnect
    ? `Tu tienda ${shop} se conectó correctamente.`
    : "Estamos preparando todo para vos.";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
          <p className="text-muted-foreground">{subtitle}</p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Redirigiendo automáticamente…</p>
          <Button
            onClick={() => navigate(isShopifyConnect ? "/shopify" : "/onboarding")}
            className="w-full"
          >
            Continuar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
