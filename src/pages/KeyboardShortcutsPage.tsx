import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Keyboard } from "lucide-react";

type Row = { action: string; keys: string };

const SHORTCUTS: Row[] = [
  { action: "Abrir búsqueda global", keys: "⌘ K / Ctrl+K" },
  { action: "Perfil (desde menú cuenta)", keys: "⇧ ⌘ P" },
  { action: "Facturación", keys: "⌘ B" },
  { action: "Configuración", keys: "⌘ S" },
  { action: "Atajos de teclado (esta página)", keys: "⌘ K (menú)" },
  { action: "Nuevo equipo", keys: "⌘ + T" },
  { action: "Cerrar sesión", keys: "⇧ ⌘ Q" },
];

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="pointer-events-none inline-flex h-7 select-none items-center gap-1 rounded-md border border-border bg-muted px-2 font-mono text-[11px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

export default function KeyboardShortcutsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Atajos de teclado</h1>
          <p className="text-muted-foreground">
            Referencia rápida. En Windows, usa <Kbd>Ctrl</Kbd> en lugar de{" "}
            <Kbd>⌘</Kbd> donde aplique.
          </p>
        </div>

        <Card className="glass-card p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Keyboard className="w-5 h-5 text-primary" />
              </div>
              Cuenta y navegación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {SHORTCUTS.map((row) => (
                <li
                  key={row.action}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 bg-card/50"
                >
                  <span className="text-sm font-medium text-foreground">{row.action}</span>
                  <Kbd>{row.keys}</Kbd>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              Los atajos del menú lateral se documentan aquí; la captura global de teclas
              se puede ampliar en una futura versión.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
