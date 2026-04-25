import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare, MoreHorizontal, ArrowLeft } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";

const VALID = ["email", "message", "more"] as const;
type Channel = (typeof VALID)[number];

export default function TeamInvitePage() {
  const { channel } = useParams<{ channel: string }>();
  const [emails, setEmails] = useState("");
  const [message, setMessage] = useState(
    "Hola, te invito a colaborar en nuestro espacio NOMADEV. Acepta la invitación desde el enlace que recibirás."
  );

  const mode = useMemo((): Channel | null => {
    if (!channel) return null;
    return (VALID as readonly string[]).includes(channel) ? (channel as Channel) : null;
  }, [channel]);

  if (!channel || !mode) {
    return <Navigate to="/team" replace />;
  }

  const title =
    mode === "email"
      ? "Invitar por email"
      : mode === "message"
        ? "Invitar con mensaje"
        : "Más opciones de invitación";

  const sendEmailInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const list = emails
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0) {
      toast.error("Añade al menos un email");
      return;
    }
    toast.success("Invitaciones en cola (demo)", {
      description: `${list.length} destinatario(s). La entrega real llegará con el módulo de equipos.`,
    });
  };

  const copyMessage = () => {
    void navigator.clipboard.writeText(message);
    toast.success("Mensaje copiado al portapapeles");
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
          <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-muted-foreground text-sm">
            {mode === "more"
              ? "Otras formas de sumar gente al espacio de trabajo."
              : "Las invitaciones reales se enviarán cuando el servicio de equipos esté conectado."}
          </p>
        </div>

        {mode === "email" && (
          <Card className="glass-card p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                Emails
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={sendEmailInvite} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emails">Destinatarios</Label>
                  <Textarea
                    id="emails"
                    value={emails}
                    onChange={(e) => setEmails(e.target.value)}
                    placeholder="uno@ejemplo.com&#10;otro@ejemplo.com"
                    rows={4}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separa varios emails con coma, punto y coma o una línea nueva.
                  </p>
                </div>
                <Button type="submit">Enviar invitaciones</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {mode === "message" && (
          <Card className="glass-card p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                Texto para compartir
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="msg">Mensaje</Label>
                <Textarea
                  id="msg"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                />
              </div>
              <Button type="button" onClick={copyMessage}>
                Copiar al portapapeles
              </Button>
            </CardContent>
          </Card>
        )}

        {mode === "more" && (
          <Card className="glass-card p-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-lg bg-muted border border-border">
                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                </div>
                Próximamente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                <li>Importar miembros desde CSV</li>
                <li>Enlace mágico de un solo uso</li>
                <li>Integración con proveedores de identidad (Google Workspace, etc.)</li>
              </ul>
              <Button className="mt-6" variant="outline" asChild>
                <Link to="/team/invite/email">Volver a invitar por email</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
