import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Truck, CheckCircle, AlertCircle } from "lucide-react";
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
      setError(err instanceof Error ? err.message : "Error al conectar con Dropi");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900/30 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900/90 border-gray-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Conexión exitosa</h2>
              <p className="text-gray-300 mb-4">Dropi conectado. Redirigiendo...</p>
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900/30 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900/90 border-gray-700 backdrop-blur-sm shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
              <Truck className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">Conectar Dropi</CardTitle>
          <p className="text-gray-300 text-sm">
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
            <Label htmlFor="dropi-email" className="text-white font-medium">
              Email
            </Label>
            <Input
              id="dropi-email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dropi-password" className="text-white font-medium">
              Contraseña
            </Label>
            <Input
              id="dropi-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dropi-test"
              checked={useTest}
              onCheckedChange={(c) => setUseTest(!!c)}
              disabled={loading}
            />
            <Label htmlFor="dropi-test" className="text-gray-300 text-sm cursor-pointer">
              Usar entorno de pruebas (test-api.dropi.co)
            </Label>
          </div>
          <Button
            onClick={handleConnect}
            disabled={loading || !email.trim() || !password}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-3"
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
          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => navigate("/dropi")}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              ← Volver a Dropi
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
