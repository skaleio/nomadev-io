import { useState } from "react";
import { DashboardLayout } from "@/features/dashboard/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function TeamNewPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Indica un nombre para el equipo");
      return;
    }
    toast.success("Solicitud registrada", {
      description: `Cuando el backend de equipos esté activo, "${trimmed}" se creará como espacio de trabajo.`,
    });
    navigate("/team");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-lg">
        <Button variant="ghost" size="sm" className="-ml-2 gap-2" asChild>
          <Link to="/team">
            <ArrowLeft className="w-4 h-4" />
            Volver al equipo
          </Link>
        </Button>

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Nuevo equipo</h1>
          <p className="text-muted-foreground text-sm">
            Crea un espacio de trabajo adicional para separar marcas o proyectos.
          </p>
        </div>

        <Card className="glass-card p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              Datos del equipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Nombre del equipo</Label>
                <Input
                  id="team-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Mi tienda dropshipping"
                  autoComplete="organization"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit">Crear equipo</Button>
                <Button type="button" variant="outline" asChild>
                  <Link to="/team">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
