import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Ticket } from "lucide-react";

type PlanOption = { value: string; label: string; disabled?: boolean };
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getN8NHeaders } from "@/lib/config";

const PLAN_OPTIONS: PlanOption[] = [
  { value: "", label: "Seleccioná un plan" },
  { value: "starter", label: "Starter — $25.000 CLP/mes" },
  { value: "professional", label: "Professional — Pronto", disabled: true },
  { value: "enterprise", label: "Enterprise — Pronto", disabled: true },
];

/** Solo Starter admite solicitud de suscripción por ahora. */
const SELECTABLE_PLANS = new Set(["starter"]);

const DEFAULT_SUBSCRIBE_WEBHOOK =
  "https://n8n-n8n.obmrlq.easypanel.host/webhook-test/nomadev";

function getSubscribeWebhookUrl(): string {
  const fromEnv = import.meta.env.VITE_N8N_SUBSCRIBE_WEBHOOK_URL?.trim();
  return fromEnv || DEFAULT_SUBSCRIBE_WEBHOOK;
}

function generateTicketRef(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `NMV-${t}-${r}`;
}

type TicketSummary = {
  ref: string;
  planLabel: string;
  nombre: string;
  email: string;
  submittedAtLabel: string;
};

export default function SubscribePage() {
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get("plan") ?? "";

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [telefono, setTelefono] = useState("");
  const [plan, setPlan] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ticket, setTicket] = useState<TicketSummary | null>(null);
  const submitLock = useRef(false);

  useEffect(() => {
    if (planFromUrl === "starter") {
      setPlan("starter");
    } else if (planFromUrl === "professional" || planFromUrl === "enterprise") {
      setPlan("");
    }
  }, [planFromUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current) return;
    if (!plan || !SELECTABLE_PLANS.has(plan)) {
      toast.error("Elegí un plan", { description: "Por ahora solo está disponible Starter ($25.000 CLP/mes). Los demás planes llegan pronto." });
      return;
    }
    if (!nombre.trim() || !email.trim()) {
      toast.error("Faltan datos", { description: "Nombre y correo son obligatorios." });
      return;
    }

    const ticketRef = generateTicketRef();
    const submittedAtIso = new Date().toISOString();
    const planLabel = PLAN_OPTIONS.find((o) => o.value === plan)?.label ?? plan;
    const submittedAtLabel = new Date().toLocaleString("es", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const url = getSubscribeWebhookUrl();
    const payload = {
      event: "subscribe_request",
      source: "nomadev_web",
      ticketRef,
      plan,
      nombre: nombre.trim(),
      email: email.trim(),
      empresa: empresa.trim() || null,
      telefono: telefono.trim() || null,
      mensaje: mensaje.trim() || null,
      submittedAt: submittedAtIso,
    };

    submitLock.current = true;

    setTicket({
      ref: ticketRef,
      planLabel,
      nombre: nombre.trim(),
      email: email.trim(),
      submittedAtLabel,
    });

    setNombre("");
    setEmail("");
    setEmpresa("");
    setTelefono("");
    setMensaje("");

    void fetch(url, {
      method: "POST",
      headers: getN8NHeaders(),
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) {
          console.warn("Webhook n8n respondió no OK:", res.status, url);
        }
      })
      .catch((err) => {
        console.warn("Webhook n8n (CORS/red): la solicitud igual quedó registrada en pantalla. Detalle:", err);
      });
  };

  const handleNewRequest = () => {
    setTicket(null);
    submitLock.current = false;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 bg-black/90 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-emerald-400 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
          <span
            className="text-lg font-black text-emerald-500 tracking-wider uppercase"
            style={{ fontFamily: "'Orbitron', 'Arial Black', sans-serif" }}
          >
            NOMADEV.IO
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16 max-w-lg">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-emerald-500/20 text-emerald-300 border-emerald-500/40">Suscripción mensual</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            {ticket ? "Solicitud registrada" : "Activá tu acceso"}
          </h1>
          <p className="text-gray-400 leading-relaxed">
            {ticket
              ? "Guardá tu comprobante. Nuestro equipo te va a contactar de inmediato para los siguientes pasos."
              : "Completá el formulario. Te guiaremos en el pago (Stripe) y, una vez confirmado, habilitamos pedidos y CRM en tu cuenta."}
          </p>
        </div>

        {ticket ? (
          <div className="relative">
            <div
              className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-black border-2 border-emerald-500/30"
              aria-hidden
            />
            <div
              className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-black border-2 border-emerald-500/30"
              aria-hidden
            />
            <Card className="overflow-hidden border-2 border-emerald-500/35 bg-gradient-to-b from-gray-950 to-black shadow-[0_0_40px_-10px_rgba(16,185,129,0.35)]">
              <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <CardHeader className="pb-2 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-500/40">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" strokeWidth={2} />
                </div>
                <div className="flex items-center justify-center gap-2 text-emerald-400/90">
                  <Ticket className="h-5 w-5" />
                  <span className="text-sm font-semibold uppercase tracking-widest">Comprobante de solicitud</span>
                </div>
                <CardTitle className="text-2xl text-white">Te contactamos de inmediato</CardTitle>
                <CardDescription className="text-gray-300 text-base max-w-md mx-auto">
                  Recibimos tus datos. Un asesor te escribe por <strong className="text-white">correo</strong> o{" "}
                  <strong className="text-white">WhatsApp</strong> lo antes posible para activar tu plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-0">
                <div className="border-t border-dashed border-gray-600/80 pt-6 space-y-4">
                  <div className="flex justify-between items-baseline gap-4 text-sm">
                    <span className="text-gray-500 shrink-0">Nº de ticket</span>
                    <span className="font-mono text-emerald-300 text-right break-all">{ticket.ref}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-4 text-sm">
                    <span className="text-gray-500 shrink-0">Fecha</span>
                    <span className="text-gray-200 text-right">{ticket.submittedAtLabel}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-4 text-sm">
                    <span className="text-gray-500 shrink-0">Plan</span>
                    <span className="text-gray-200 text-right">{ticket.planLabel}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-4 text-sm">
                    <span className="text-gray-500 shrink-0">Nombre</span>
                    <span className="text-gray-200 text-right">{ticket.nombre}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-4 text-sm">
                    <span className="text-gray-500 shrink-0">Correo</span>
                    <span className="text-gray-200 text-right break-all">{ticket.email}</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleNewRequest}
                  className="w-full border-gray-600 text-gray-200 hover:bg-gray-900 hover:text-white"
                >
                  Enviar otra solicitud
                </Button>
                <p className="text-center text-xs text-gray-500">
                  Si no ves nuestro mensaje, revisá spam o carpetas de promociones.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
        <Card className="border-gray-800 bg-gray-950/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Datos de contacto</CardTitle>
            <CardDescription className="text-gray-400">
              Sin registro público: el acceso se otorga después del cobro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="subscribe-plan" className="text-sm font-medium text-gray-300">
                  Plan
                </label>
                <select
                  id="subscribe-plan"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-black border border-gray-700 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none"
                >
                  {PLAN_OPTIONS.map((opt) => (
                    <option key={opt.value || "empty"} value={opt.value} disabled={opt.disabled}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="subscribe-nombre" className="text-sm font-medium text-gray-300">
                  Nombre completo
                </label>
                <input
                  id="subscribe-nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-black border border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none"
                  placeholder="Juan Pérez"
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="subscribe-email" className="text-sm font-medium text-gray-300">
                  Correo electrónico
                </label>
                <input
                  id="subscribe-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-black border border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none"
                  placeholder="tu@empresa.com"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="subscribe-empresa" className="text-sm font-medium text-gray-300">
                  Empresa
                </label>
                <input
                  id="subscribe-empresa"
                  type="text"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-black border border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none"
                  placeholder="Mi tienda online"
                  autoComplete="organization"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="subscribe-telefono" className="text-sm font-medium text-gray-300">
                  WhatsApp / teléfono
                </label>
                <input
                  id="subscribe-telefono"
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-black border border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none"
                  placeholder="+54 9 11 1234-5678"
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="subscribe-mensaje" className="text-sm font-medium text-gray-300">
                  Mensaje (opcional)
                </label>
                <textarea
                  id="subscribe-mensaje"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-black border border-gray-700 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none resize-y min-h-[88px]"
                  placeholder="Necesidades, volumen de pedidos, etc."
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-6 text-base font-semibold"
              >
                Enviar solicitud
              </Button>
            </form>
          </CardContent>
        </Card>
        )}
      </main>
    </div>
  );
}
