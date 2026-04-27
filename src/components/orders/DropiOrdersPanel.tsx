import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NomaDatePicker } from "@/components/ui/noma-date-picker";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { parseDropiXlsxArrayBuffer, toSupabaseInsertRows } from "@/lib/dropiImport";
import {
  aggregateOrdersByRegion,
  attributedMetaSpend,
  carrierKey,
  computeDailyProfitTrend,
  computeDropiMetrics,
  computeMetricsByCarrier,
  computeAllProductInsights,
  detectDateRange,
  filterDropiOrders,
  formatRoas,
  regionKey,
  type DropiMetricsFilters,
} from "@/lib/computeDropiMetrics";
import {
  Upload,
  RefreshCw,
  BarChart3,
  DollarSign,
  TrendingUp,
  Target,
  Percent,
  MapPin,
  Package,
  Megaphone,
  Scale,
  Truck,
  Check,
  Filter,
  Search,
  ChevronDown,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { regionChartColor } from "@/lib/regionChartColors";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DropiOrderRow = Tables<"dropi_orders">;

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}

function isoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function minIso(a: string, b: string): string { return a <= b ? a : b; }
function maxIso(a: string, b: string): string { return a >= b ? a : b; }

const BUCKET_LABEL: Record<string, string> = {
  cancelled: "Cancelado",
  delivered: "Entregado",
  return_flow: "Devolución",
  issue: "Novedad",
  in_transit: "En tránsito",
  pending: "Pendiente",
};

type BucketVariant = "success" | "destructive" | "warning" | "info" | "soft";

function bucketVariant(bucket: string): BucketVariant {
  switch (bucket) {
    case "delivered":   return "success";
    case "cancelled":   return "destructive";
    case "issue":       return "warning";
    case "return_flow": return "warning";
    case "pending":     return "soft";
    default:            return "info";
  }
}

interface DropiOrdersPanelProps {
  userId: string | undefined;
}

export function DropiOrdersPanel({ userId }: DropiOrdersPanelProps) {
  const [{ from: dateFrom, to: dateTo }, setRange] = useState(defaultRange);
  const [region, setRegion] = useState("all");
  const [product, setProduct] = useState("all");
  const [carrier, setCarrier] = useState("all");
  const [metaInput, setMetaInput] = useState("");
  const [orders, setOrders] = useState<DropiOrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStage, setImportStage] = useState<string | null>(null);
  const [chartPeriodDays, setChartPeriodDays] = useState<1 | 7 | 14 | 30>(30);
  const [vizRegion, setVizRegion] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [regionFilterOpen, setRegionFilterOpen] = useState(false);
  const [productFilterOpen, setProductFilterOpen] = useState(false);
  const [carrierFilterOpen, setCarrierFilterOpen] = useState(false);
  const [clientQuery, setClientQuery] = useState("");
  const [postImport, setPostImport] = useState<{
    open: boolean;
    detectedFrom: string;
    detectedTo: string;
    rangeFrom: string;
    rangeTo: string;
    metaInput: string;
    rowsImported: number;
  } | null>(null);

  const filters: DropiMetricsFilters = useMemo(() => ({ region, product, carrier }), [region, product, carrier]);

  const chartBounds = useMemo(() => {
    const today = new Date();
    const chartTo = isoLocal(today);
    const start = new Date(today);
    start.setDate(start.getDate() - (chartPeriodDays - 1));
    return { chartFrom: isoLocal(start), chartTo };
  }, [chartPeriodDays]);

  const fetchBounds = useMemo(() => ({
    from: minIso(dateFrom, chartBounds.chartFrom),
    to: maxIso(dateTo, chartBounds.chartTo),
  }), [dateFrom, dateTo, chartBounds.chartFrom, chartBounds.chartTo]);

  const loadOrders = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("dropi_orders")
        .select("*")
        .eq("user_id", userId)
        .gte("order_date", fetchBounds.from)
        .lte("order_date", fetchBounds.to)
        .order("order_date", { ascending: false });
      if (error) throw error;
      setOrders(data ?? []);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "No se pudieron cargar los pedidos");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [userId, fetchBounds.from, fetchBounds.to]);

  const loadMetaSnapshot = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("dropi_meta_spend_snapshots")
      .select("meta_ad_spend")
      .eq("user_id", userId)
      .eq("period_start", dateFrom)
      .eq("period_end", dateTo)
      .maybeSingle();
    if (error) { console.warn(error); return; }
    const spend = data?.meta_ad_spend;
    setMetaInput(spend != null ? String(spend) : "");
  }, [userId, dateFrom, dateTo]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);
  useEffect(() => { void loadMetaSnapshot(); }, [loadMetaSnapshot]);

  const ordersInMainRange = useMemo(
    () => orders.filter((o) => o.order_date >= dateFrom && o.order_date <= dateTo),
    [orders, dateFrom, dateTo],
  );

  const ordersForChartWindow = useMemo(
    () => orders.filter((o) => o.order_date >= chartBounds.chartFrom && o.order_date <= chartBounds.chartTo),
    [orders, chartBounds.chartFrom, chartBounds.chartTo],
  );

  /** Pedidos del rango principal con filtros de producto y logística (sin filtro de región) — base del selector y conteos. */
  const regionFilterRows = useMemo(
    () => filterDropiOrders(ordersInMainRange, { region: "all", product, carrier }),
    [ordersInMainRange, product, carrier],
  );

  const regionFilterOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of regionFilterRows) {
      const k = regionKey(o);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
    return [
      { value: "all" as const, label: "Todas las regiones", count: regionFilterRows.length },
      ...sorted.map(([name, count]) => ({ value: name, label: name, count })),
    ];
  }, [regionFilterRows]);

  const productFilterRows = useMemo(
    () => filterDropiOrders(ordersInMainRange, { region, product: "all", carrier }),
    [ordersInMainRange, region, carrier],
  );

  const productFilterOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of productFilterRows) {
      const k = (o.categories ?? "").trim() || "Sin categoría";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
    return [
      { value: "all" as const, label: "Todos los productos", count: productFilterRows.length },
      ...sorted.map(([name, count]) => ({ value: name, label: name, count })),
    ];
  }, [productFilterRows]);

  const carrierFilterRows = useMemo(
    () => filterDropiOrders(ordersInMainRange, { region, product, carrier: "all" }),
    [ordersInMainRange, region, product],
  );

  const carrierFilterOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of carrierFilterRows) {
      const k = carrierKey(o);
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"));
    return [
      { value: "all" as const, label: "Todas las logísticas", count: carrierFilterRows.length },
      ...sorted.map(([name, count]) => ({ value: name, label: name, count })),
    ];
  }, [carrierFilterRows]);

  const filteredForMetrics = useMemo(
    () => filterDropiOrders(ordersInMainRange, filters),
    [ordersInMainRange, filters],
  );

  const ordersListFiltered = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return filteredForMetrics;
    return filteredForMetrics.filter((o) => {
      const blob = [
        o.customer_name,
        o.customer_phone,
        o.customer_email,
        o.address,
        String(o.dropi_numeric_id),
        o.guide_number,
        o.shop_order_number,
        regionKey(o),
        carrierKey(o),
        (o.categories ?? ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    });
  }, [filteredForMetrics, clientQuery]);

  const ordersChartProductOnly = useMemo(
    () => filterDropiOrders(ordersForChartWindow, { region: "all", product, carrier }),
    [ordersForChartWindow, product, carrier],
  );

  const profitTrend = useMemo(
    () => computeDailyProfitTrend(ordersChartProductOnly, chartBounds.chartFrom, chartBounds.chartTo),
    [ordersChartProductOnly, chartBounds.chartFrom, chartBounds.chartTo],
  );

  const regionBars = useMemo(() => aggregateOrdersByRegion(ordersChartProductOnly), [ordersChartProductOnly]);

  const metaSpend = useMemo(() => {
    const n = Number(String(metaInput).replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }, [metaInput]);

  const regionSliceForViz = useMemo(() => {
    if (!vizRegion) return [];
    return ordersChartProductOnly.filter((o) => regionKey(o) === vizRegion);
  }, [ordersChartProductOnly, vizRegion]);

  const metaForRegionViz = useMemo(
    () => attributedMetaSpend(metaSpend, regionSliceForViz.length, ordersChartProductOnly.length),
    [metaSpend, regionSliceForViz.length, ordersChartProductOnly.length],
  );

  const regionVizMetrics = useMemo(
    () => (vizRegion && regionSliceForViz.length ? computeDropiMetrics(regionSliceForViz, metaForRegionViz) : null),
    [vizRegion, regionSliceForViz, metaForRegionViz],
  );

  const metrics = useMemo(
    () => computeDropiMetrics(filteredForMetrics, metaSpend),
    [filteredForMetrics, metaSpend],
  );

  const productInsights = useMemo(
    () => computeAllProductInsights(ordersInMainRange, filters, metaSpend),
    [ordersInMainRange, filters, metaSpend],
  );

  const carrierBreakdown = useMemo(() => {
    const base = filterDropiOrders(ordersInMainRange, { region, product, carrier: "all" });
    return computeMetricsByCarrier(base, metaSpend);
  }, [ordersInMainRange, region, product, metaSpend]);

  const saveMetaSpend = async () => {
    if (!userId) return;
    try {
      const { error } = await supabase.from("dropi_meta_spend_snapshots").upsert(
        { user_id: userId, period_start: dateFrom, period_end: dateTo, meta_ad_spend: metaSpend },
        { onConflict: "user_id,period_start,period_end" },
      );
      if (error) throw error;
      toast.success("Gasto en Meta guardado para este rango");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId) return;
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast.error("Formato no admitido. Usa un archivo Excel de exportación de guías.");
      return;
    }
    setImporting(true);
    setImportStage("Preparando importación…");
    try {
      // Deja que React pinte la barra antes de trabajo pesado (parse/insert)
      await new Promise((r) => setTimeout(r, 50));

      setImportStage("Leyendo archivo…");
      const buf = await file.arrayBuffer();

      setImportStage("Procesando datos…");
      const parsed = parseDropiXlsxArrayBuffer(buf);
      if (!parsed.length) { toast.error("No se encontraron filas válidas (revisa ID y FECHA)"); return; }

      const detected = detectDateRange(parsed.map((p) => p.order_date));
      if (!detected) { toast.error("No pudimos detectar fechas válidas en el archivo"); return; }

      setImportStage("Subiendo datos…");
      const { data: imp, error: impErr } = await supabase
        .from("dropi_order_imports")
        .insert({ user_id: userId, source_filename: file.name, row_count: parsed.length })
        .select("id")
        .single();

      if (impErr || !imp) throw impErr ?? new Error("Import batch");

      const rows = toSupabaseInsertRows(userId, imp.id, parsed);
      for (let i = 0; i < rows.length; i += 120) {
        if (i === 0) setImportStage("Guardando pedidos…");
        const { error: upErr } = await supabase.from("dropi_orders").upsert(rows.slice(i, i + 120), {
          onConflict: "user_id,dropi_numeric_id",
        });
        if (upErr) throw upErr;
      }

      setImportStage("Preparando resumen…");
      const metaSnapshot = await supabase
        .from("dropi_meta_spend_snapshots")
        .select("meta_ad_spend")
        .eq("user_id", userId)
        .eq("period_start", detected.from)
        .eq("period_end", detected.to)
        .maybeSingle();
      const existingMeta = (metaSnapshot.data ?? null) as { meta_ad_spend: number | null } | null;

      setPostImport({
        open: true,
        detectedFrom: detected.from,
        detectedTo: detected.to,
        rangeFrom: detected.from,
        rangeTo: detected.to,
        metaInput: existingMeta?.meta_ad_spend != null ? String(existingMeta.meta_ad_spend) : "",
        rowsImported: parsed.length,
      });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error importando");
    } finally {
      setImporting(false);
      setImportStage(null);
    }
  };

  const confirmPostImport = async () => {
    if (!postImport || !userId) return;
    const { rangeFrom, rangeTo, metaInput: pmInput, rowsImported } = postImport;
    if (!rangeFrom || !rangeTo || rangeFrom > rangeTo) { toast.error("Rango de fechas inválido"); return; }
    const metaValue = Number(String(pmInput).replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(metaValue) || metaValue < 0) {
      toast.error("Indica el gasto en Meta para este rango (0 si no invertiste)");
      return;
    }
    try {
      const { error } = await supabase.from("dropi_meta_spend_snapshots").upsert(
        { user_id: userId, period_start: rangeFrom, period_end: rangeTo, meta_ad_spend: metaValue },
        { onConflict: "user_id,period_start,period_end" },
      );
      if (error) throw error;
      setRange({ from: rangeFrom, to: rangeTo });
      setMetaInput(String(metaValue));
      setPostImport(null);
      toast.success(`Importadas ${rowsImported} filas y gasto Meta guardado para ${rangeFrom} → ${rangeTo}`);
      await loadOrders();
      // Señal para que el Dashboard se re-sincronice sin reload.
      try {
        localStorage.setItem("dropi:lastImportAt", String(Date.now()));
      } catch {
        // noop (modo privado / storage bloqueado)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error guardando gasto Meta");
    }
  };

  if (!userId) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">Inicia sesión para importar pedidos.</CardContent>
      </Card>
    );
  }

  const total = metrics.totalPedidos;
  const c = metrics.counts;
  const pct = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : "0%");

  /* ── chart theme ── */
  const chartTheme = {
    grid: "hsl(var(--border))",
    tick: "hsl(var(--muted-foreground))",
    tooltip: {
      contentStyle: { backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" },
      labelStyle: { color: "hsl(var(--foreground))", fontWeight: 500 },
    },
    success: "hsl(var(--success))",
    primary: "hsl(var(--primary))",
    muted: "hsl(var(--muted-foreground))",
  };

  const dimensionFilterActive =
    (region !== "all" ? 1 : 0) + (product !== "all" ? 1 : 0) + (carrier !== "all" ? 1 : 0);

  return (
    <div className="space-y-6">
      {importing && (
        <div className="sticky top-16 z-20">
          <div className="rounded-2xl border border-border/50 bg-card/90 p-3 shadow-elev-2 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-foreground/90">{importStage ?? "Importando datos…"}</p>
              <Badge variant="soft" className="tabular-nums">En progreso</Badge>
            </div>
            <div className="mt-2">
              {/* Indeterminado: valor ~60 + shimmer */}
              <div className="relative">
                <Progress value={60} className="h-2 bg-muted/60" />
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                  <div className="h-full w-1/2 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Importar ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-4" strokeWidth={2} />
            Importar guías de pedidos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <NomaDatePicker
            label="Desde (FECHA pedido)"
            value={dateFrom}
            onChange={(v) => setRange((r) => ({ ...r, from: v }))}
            maxValue={dateTo || undefined}
          />
          <NomaDatePicker
            label="Hasta"
            value={dateTo}
            onChange={(v) => setRange((r) => ({ ...r, to: v }))}
            minValue={dateFrom || undefined}
          />
          <p className="text-xs text-muted-foreground max-w-md pb-1">
            Región, producto y logística se ajustan desde <span className="font-medium text-foreground/90">Filtros</span> en la lista de pedidos.
          </p>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Archivo</label>
            <Input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => void onFile(e)}
              disabled={importing}
              className="max-w-xs"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadOrders()} disabled={loading}>
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </Button>
        </CardContent>
      </Card>

      {/* ── Meta spend ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="size-4" strokeWidth={2} />
            Inversión Meta (gasto en ads)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Monto CLP (este rango de fechas)</label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Ej: 270000"
              value={metaInput}
              onChange={(e) => setMetaInput(e.target.value)}
              className="w-48"
            />
          </div>
          <Button size="sm" onClick={() => void saveMetaSpend()}>
            Guardar gasto
          </Button>
          <p className="text-xs text-muted-foreground max-w-xl">
            ROAS y CPA usan este monto. No viene en el archivo de importación; lo guardamos por rango para que las métricas sean reproducibles.
          </p>
        </CardContent>
      </Card>

      {/* ── Métricas principales ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard title="Total vendido" value={formatMoney(metrics.totalVendido)} icon={DollarSign} color="primary" description="Suma valor compra productos, excl. cancelados / anulados" loading={loading} />
        <MetricCard title="Ganancia real" value={formatMoney(metrics.gananciaReal)} icon={TrendingUp} color="success" description="Suma GANANCIA solo pedidos entregados" loading={loading} />
        <MetricCard title="Ganancia estimada" value={formatMoney(metrics.gananciaEstimada)} icon={TrendingUp} color="warning" description="Suma GANANCIA en todos los no cancelados" loading={loading} />
        <MetricCard title="Ganancia promedio" value={formatMoney(metrics.gananciaPromedioEntregado)} icon={Target} color="primary" description="Por pedido entregado" loading={loading} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Inversión Meta" value={formatMoney(metrics.inversionMeta)} icon={Megaphone} color="warning" description="Gasto en ads (manual)" loading={loading} />
        <MetricCard title="ROAS ventas" value={formatRoas(metrics.roasVentas)} icon={DollarSign} color="info" description="Total vendido / ads" loading={loading} />
        <MetricCard title="ROAS real" value={formatRoas(metrics.roasReal)} icon={TrendingUp} color="success" description="Ganancia real / ads" loading={loading} />
        <MetricCard title="CPA" value={metrics.cpa != null ? formatMoney(metrics.cpa) : "—"} icon={Target} color="primary" description="Ads / pedidos entregados" loading={loading} />
        <MetricCard title="AOV" value={formatMoney(metrics.aov)} icon={Package} color="primary" description="Ticket promedio (total vendido / no cancelados)" loading={loading} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricCard title="Total pedidos" value="100%" icon={Package} description={`${metrics.totalPedidos} pedidos`} loading={loading} />
        <MetricCard title="Confirmados *" value={`${c.confirmados} (${pct(c.confirmados)})`} icon={BarChart3} color="info" description="En tránsito / reparto" loading={loading} />
        <MetricCard title="Entregados" value={`${c.entregados} (${pct(c.entregados)})`} icon={TrendingUp} color="success" loading={loading} />
        <MetricCard title="Pendientes" value={`${c.pendientes} (${pct(c.pendientes)})`} icon={Target} loading={loading} />
        <MetricCard title="Novedades" value={`${c.novedades} (${pct(c.novedades)})`} icon={BarChart3} color="warning" loading={loading} />
        <MetricCard title="En devolución" value={`${c.enDevolucion} (${pct(c.enDevolucion)})`} icon={Package} color="destructive" loading={loading} />
        <MetricCard title="Cancelados" value={`${c.cancelados} (${pct(c.cancelados)})`} icon={Package} color="destructive" loading={loading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="% Ganancia real" value={`${metrics.pctGananciaReal}%`} icon={Percent} color="success" description="Ganancia bruta sobre ventas de pedidos entregados" loading={loading} />
        <MetricCard title="% Ganancia estimada" value={`${metrics.pctGananciaEstimada}%`} icon={Percent} color="warning" description="Ganancia bruta sobre ventas de pedidos no cancelados" loading={loading} />
        <MetricCard
          title="Top región entregados"
          value={metrics.topRegionEntregados?.label ?? "—"}
          icon={MapPin}
          color="info"
          description={metrics.topRegionEntregados ? `${metrics.topRegionEntregados.count} entregados` : "Sin entregados en el filtro"}
          loading={loading}
        />
      </div>

      {/* ── Tendencia de ganancias ── */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>Tendencia de ganancias</CardTitle>
          <div className="flex flex-wrap gap-2">
            {([1, 7, 14, 30] as const).map((d) => (
              <Button
                key={d}
                size="sm"
                variant={chartPeriodDays === d ? "default" : "outline"}
                onClick={() => setChartPeriodDays(d)}
              >
                {d === 1 ? "Hoy" : `${d} días`}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="h-[320px]">
          {profitTrend.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">Sin datos en este periodo del gráfico.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={profitTrend.map((p) => ({
                  ...p,
                  fecha: new Date(p.date + "T12:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "short" }),
                }))}
                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.4} />
                <XAxis dataKey="fecha" tick={{ fill: chartTheme.tick, fontSize: 11 }} />
                <YAxis tick={{ fill: chartTheme.tick, fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip {...chartTheme.tooltip} formatter={(value: number) => [formatMoney(value), ""]} />
                <Legend />
                <Line type="monotone" dataKey="gananciaReal" name="Ganancia real (entregados)" stroke={chartTheme.success} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="gananciaEstimada" name="Ganancia estimada (no cancel.)" stroke={chartTheme.primary} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Periodo del gráfico: {chartBounds.chartFrom} → {chartBounds.chartTo}. Respeta el filtro de producto; las regiones se muestran todas en este gráfico.
          </p>
        </CardContent>
      </Card>

      {/* ── Pedidos por región ── */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle>Pedidos por región</CardTitle>
          {vizRegion && (
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setVizRegion(null)}>
              Quitar selección
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {regionBars.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos para el periodo del gráfico y producto seleccionado.</p>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={regionBars}
                  margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                  onClick={(s) => {
                    const p = s?.activePayload?.[0]?.payload as { region?: string } | undefined;
                    const r = p?.region;
                    if (r) setVizRegion((prev) => (prev === r ? null : r));
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} opacity={0.4} />
                  <XAxis dataKey="region" tick={{ fill: chartTheme.tick, fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={72} />
                  <YAxis tick={{ fill: chartTheme.tick, fontSize: 11 }} allowDecimals={false} />
                  <Tooltip cursor={{ fill: "hsl(var(--accent)/0.3)" }} {...chartTheme.tooltip} />
                  <Bar dataKey="count" name="Pedidos" radius={[6, 6, 0, 0]}>
                    {regionBars.map((entry) => {
                      const fill = regionChartColor(entry.region);
                      const selected = vizRegion === entry.region;
                      const dimmed = vizRegion != null && !selected;
                      return (
                        <Cell
                          key={entry.region}
                          fill={fill}
                          fillOpacity={dimmed ? 0.38 : 1}
                          stroke={selected ? "hsl(var(--foreground))" : "transparent"}
                          strokeWidth={selected ? 2 : 0}
                          className="cursor-pointer transition-[opacity] duration-200"
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Clic en una barra para ver KPIs de esa región. El gasto en anuncios se reparte proporcionalmente al volumen de pedidos.
          </p>

          {vizRegion && regionVizMetrics && (
            <div className="space-y-3 border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span
                  className="flex size-6 items-center justify-center rounded-md ring-1 ring-white/10"
                  style={{ backgroundColor: `${regionChartColor(vizRegion)}33` }}
                  aria-hidden
                >
                  <MapPin className="size-3.5" style={{ color: regionChartColor(vizRegion) }} />
                </span>
                {vizRegion}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <MetricCard title="Pedidos" value={String(regionVizMetrics.totalPedidos)} icon={Package} loading={loading} />
                <MetricCard title="Total vendido" value={formatMoney(regionVizMetrics.totalVendido)} icon={DollarSign} loading={loading} />
                <MetricCard title="Ganancia real" value={formatMoney(regionVizMetrics.gananciaReal)} icon={TrendingUp} color="success" loading={loading} />
                <MetricCard title="Ganancia est." value={formatMoney(regionVizMetrics.gananciaEstimada)} icon={TrendingUp} color="warning" loading={loading} />
                <MetricCard title="ROAS real" value={formatRoas(regionVizMetrics.roasReal)} icon={BarChart3} loading={loading} />
                <MetricCard title="CPA" value={regionVizMetrics.cpa != null ? formatMoney(regionVizMetrics.cpa) : "—"} icon={Target} loading={loading} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Logística ── */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Truck className="size-4" strokeWidth={2} /> Logística (transportadora)
          </CardTitle>
          {carrier !== "all" && (
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setCarrier("all")}>
              Quitar filtro
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {carrierBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin pedidos en este rango / filtros.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {carrierBreakdown.map((row) => {
                const totalRow = row.metrics.totalPedidos;
                const pctRow = (n: number) => (totalRow > 0 ? `${Math.round((n / totalRow) * 100)}%` : "0%");
                const isActive = carrier === row.carrier;
                return (
                  <button
                    key={row.carrier}
                    type="button"
                    onClick={() => setCarrier(isActive ? "all" : row.carrier)}
                    className={`text-left rounded-xl border p-4 transition-all duration-base ease-standard ${
                      isActive
                        ? "border-primary/30 bg-primary/[0.04] shadow-glow"
                        : "border-border/60 bg-card hover:border-border hover:shadow-elev-1"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                        <Truck className={`size-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        {row.carrier}
                      </div>
                      <Badge variant="soft">{row.metrics.totalPedidos} pedidos</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground mb-0.5">Entregados</div>
                        <div className="text-success font-semibold tabular-nums">{row.metrics.counts.entregados} ({pctRow(row.metrics.counts.entregados)})</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-0.5">En tránsito</div>
                        <div className="text-info font-semibold tabular-nums">{row.metrics.counts.confirmados} ({pctRow(row.metrics.counts.confirmados)})</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-0.5">Devolución</div>
                        <div className="text-warning font-semibold tabular-nums">{row.metrics.counts.enDevolucion} ({pctRow(row.metrics.counts.enDevolucion)})</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-0.5">Cancelados</div>
                        <div className="text-destructive font-semibold tabular-nums">{row.metrics.counts.cancelados} ({pctRow(row.metrics.counts.cancelados)})</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-0.5">Ganancia real</div>
                        <div className="text-foreground font-semibold tabular-nums">{formatMoney(row.metrics.gananciaReal)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-0.5">ROAS real</div>
                        <div className="text-foreground font-semibold tabular-nums">{formatRoas(row.metrics.roasReal)}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Clic en una tarjeta para filtrar todo el panel por esa logística. Meta se reparte por volumen de pedidos.
          </p>
        </CardContent>
      </Card>

      {/* ── Rendimiento por categoría ── */}
      {productInsights.general && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-gradient-to-b from-muted/25 to-transparent">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
                  Rendimiento por categoría
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Usa el rango de fechas y filtros de región / logística. Las categorías provienen de la columna importada en el archivo.
                  Meta se prorratea por volumen en cada categoría; en &quot;General&quot; se usa el gasto completo del rango.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {(() => {
                const g = productInsights.general;
                const list = productInsights.byProduct;
                const singleCategory =
                  list.length === 1 && list[0].pedidos === g.pedidos ? list[0] : null;
                const tiles = singleCategory
                  ? [{ ...g, label: `General · ${singleCategory.label}`, __single: true as const }]
                  : [g, ...list];

                return tiles.map((ins) => {
                  const isGeneralOnly = "label" in ins && ins.label.startsWith("General (");
                  const isMergedSingle = "__single" in ins && ins.__single;
                  const isHighlight = isGeneralOnly || isMergedSingle;
                  const wide = tiles.length === 1 || (isHighlight && tiles.length <= 2);
                  const key =
                    isMergedSingle && "label" in ins
                      ? `merged-${String(ins.label)}`
                      : ins.label.startsWith("General (")
                        ? "__general__"
                        : ins.label;

                  return (
                    <Card
                      key={key}
                      className={[
                        "relative overflow-hidden",
                        isHighlight ? "border-primary/25 bg-primary/[0.035]" : "",
                        wide ? "lg:col-span-2 xl:col-span-3" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-20 opacity-70"
                        style={{
                          background:
                            isHighlight
                              ? "radial-gradient(1200px 180px at 20% 0%, rgba(45,212,191,0.14), transparent 60%)"
                              : "radial-gradient(900px 160px at 20% 0%, rgba(148,163,184,0.10), transparent 55%)",
                        }}
                        aria-hidden
                      />
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base leading-snug">
                          {isMergedSingle && "label" in ins
                            ? ins.label
                            : isGeneralOnly
                              ? "Resumen general"
                              : ins.label}
                        </CardTitle>
                        {isGeneralOnly ? (
                          <p className="text-xs text-muted-foreground">
                            Todas las categorías en este periodo y filtros.
                          </p>
                        ) : isMergedSingle ? (
                          <p className="text-xs text-muted-foreground">
                            Única categoría en este periodo; mismos totales que el resumen general.
                          </p>
                        ) : null}
                      </CardHeader>

                      <CardContent className={wide ? "grid gap-4 lg:grid-cols-[1.1fr_0.9fr]" : "space-y-4"}>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl border border-border/40 bg-muted/15 p-4 text-sm">
                          {[
                            { label: "Pedidos", value: String(ins.pedidos) },
                            { label: "Precio promedio", value: formatMoney(ins.precioPromedio) },
                            { label: "Entrega", value: `${ins.pctEntregados}%` },
                            { label: "Devolución", value: `${ins.pctDevolucion}%` },
                            { label: "Cancelados", value: `${ins.pctCancelados}%` },
                            { label: "CPA", value: ins.cpa != null ? formatMoney(ins.cpa) : "—" },
                          ].map((item) => (
                            <div key={item.label} className="min-w-0">
                              <div className="text-[11px] font-medium text-muted-foreground mb-1">
                                {item.label}
                              </div>
                              <div className="font-semibold text-foreground tabular-nums truncate">
                                {item.value}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <MetricCard
                            title="Breakeven / pedido"
                            value={ins.breakevenPorPedido != null ? formatMoney(ins.breakevenPorPedido) : "—"}
                            icon={Scale}
                            description="Coste variable medio entregado + Meta atribuida / entregado"
                            loading={loading}
                          />
                          <MetricCard
                            title="Profit neto / pedido"
                            value={ins.profitNetoPorPedido != null ? formatMoney(ins.profitNetoPorPedido) : "—"}
                            icon={DollarSign}
                            color="success"
                            description="Ganancia media entregado − Meta atribuida por entregado"
                            loading={loading}
                          />
                          <MetricCard
                            title="Precio sugerido"
                            value={ins.precioSugerido != null ? formatMoney(ins.precioSugerido) : "—"}
                            icon={Target}
                            description="Breakeven × 1,30 (margen orientativo)"
                            loading={loading}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Lista de pedidos ── */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-1.5">
              <CardTitle className="text-lg leading-tight sm:text-xl">
                Pedidos
                <span className="ml-2 text-base font-normal text-muted-foreground tabular-nums">
                  ({ordersListFiltered.length}
                  {clientQuery.trim() && filteredForMetrics.length !== ordersListFiltered.length
                    ? ` de ${filteredForMetrics.length}`
                    : ""}
                  )
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                CPA general:{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {metrics.cpa != null ? formatMoney(metrics.cpa) : "—"}
                </span>
                {metrics.cpa == null && (
                  <span className="ml-1">(añade gasto en anuncios y pedidos entregados)</span>
                )}
              </p>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center lg:max-w-xl">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  placeholder="Buscar cliente, teléfono, email, guía…"
                  value={clientQuery}
                  onChange={(e) => setClientQuery(e.target.value)}
                  className="h-9 pl-9"
                  aria-label="Buscar en la lista de pedidos"
                />
              </div>
              <Popover
                modal={false}
                open={filtersOpen}
                onOpenChange={(open) => {
                  setFiltersOpen(open);
                  if (!open) {
                    setRegionFilterOpen(false);
                    setProductFilterOpen(false);
                    setCarrierFilterOpen(false);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-full shrink-0 justify-center gap-2 border-border/80 bg-input/40 sm:w-auto"
                  >
                    <Filter className="size-4" />
                    Filtros
                    {dimensionFilterActive > 0 ? (
                      <Badge variant="secondary" className="h-5 min-w-5 rounded-full px-1.5 tabular-nums">
                        {dimensionFilterActive}
                      </Badge>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(100vw-1.5rem,380px)] p-0" align="end">
                  <div className="border-b border-border/60 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Abre cada desplegable para buscar y elegir. Los números son pedidos en el rango de fechas del panel
                      superior, cruzados con lo que ya tengas en los otros filtros.
                    </p>
                  </div>

                  <div className="space-y-3 p-3">
                    {/* Región */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Región</p>
                      <Popover
                        modal={false}
                        open={regionFilterOpen}
                        onOpenChange={(open) => {
                          setRegionFilterOpen(open);
                          if (open) {
                            setProductFilterOpen(false);
                            setCarrierFilterOpen(false);
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-full justify-between gap-2 rounded-lg border-border/80 bg-input/50 px-3 font-normal shadow-inner shadow-black/[0.03]"
                            aria-expanded={regionFilterOpen}
                          >
                            <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
                              {region !== "all" ? (
                                <span
                                  className="size-2 shrink-0 rounded-full ring-1 ring-white/20"
                                  style={{ backgroundColor: regionChartColor(region) }}
                                  aria-hidden
                                />
                              ) : null}
                              <span className="truncate">
                                {region === "all"
                                  ? "Todas las regiones"
                                  : regionFilterOptions.find((o) => o.value === region)?.label ?? region}
                              </span>
                              <Badge variant="soft" className="ml-auto shrink-0 tabular-nums text-[10px]">
                                {region === "all"
                                  ? regionFilterRows.length
                                  : regionFilterOptions.find((o) => o.value === region)?.count ?? 0}
                              </Badge>
                            </span>
                            <ChevronDown className="size-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" sideOffset={6}>
                          <Command shouldFilter>
                            <CommandInput placeholder="Buscar región…" className="h-9" />
                            <CommandList className="max-h-[220px]">
                              <CommandEmpty>Sin coincidencias.</CommandEmpty>
                              <CommandGroup>
                                {regionFilterOptions.map((opt) => (
                                  <CommandItem
                                    key={`r-${opt.value}`}
                                    value={`${opt.label} ${opt.count}`}
                                    onSelect={() => {
                                      setRegion(opt.value);
                                      setRegionFilterOpen(false);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <span
                                      className="mr-2 size-2 shrink-0 rounded-full ring-1 ring-white/10"
                                      style={{
                                        backgroundColor: opt.value === "all" ? "hsl(var(--muted))" : regionChartColor(opt.label),
                                      }}
                                      aria-hidden
                                    />
                                    <span className="flex-1 truncate">{opt.label}</span>
                                    <span className="tabular-nums text-xs text-muted-foreground">{opt.count}</span>
                                    {region === opt.value ? <Check className="ml-2 size-4 shrink-0 text-primary" /> : null}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Producto */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Producto / categoría</p>
                      <Popover
                        modal={false}
                        open={productFilterOpen}
                        onOpenChange={(open) => {
                          setProductFilterOpen(open);
                          if (open) {
                            setRegionFilterOpen(false);
                            setCarrierFilterOpen(false);
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-full justify-between gap-2 rounded-lg border-border/80 bg-input/50 px-3 font-normal shadow-inner shadow-black/[0.03]"
                            aria-expanded={productFilterOpen}
                          >
                            <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
                              <Package className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                              <span className="truncate">
                                {product === "all"
                                  ? "Todos los productos"
                                  : productFilterOptions.find((o) => o.value === product)?.label ?? product}
                              </span>
                              <Badge variant="soft" className="ml-auto shrink-0 tabular-nums text-[10px]">
                                {product === "all"
                                  ? productFilterRows.length
                                  : productFilterOptions.find((o) => o.value === product)?.count ?? 0}
                              </Badge>
                            </span>
                            <ChevronDown className="size-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" sideOffset={6}>
                          <Command shouldFilter>
                            <CommandInput placeholder="Buscar categoría…" className="h-9" />
                            <CommandList className="max-h-[220px]">
                              <CommandEmpty>Sin coincidencias.</CommandEmpty>
                              <CommandGroup>
                                {productFilterOptions.map((opt) => (
                                  <CommandItem
                                    key={`p-${opt.value}`}
                                    value={`${opt.label} ${opt.count}`}
                                    onSelect={() => {
                                      setProduct(opt.value);
                                      setProductFilterOpen(false);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Package className="mr-2 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                                    <span className="flex-1 truncate">{opt.label}</span>
                                    <span className="tabular-nums text-xs text-muted-foreground">{opt.count}</span>
                                    {product === opt.value ? <Check className="ml-2 size-4 shrink-0 text-primary" /> : null}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Logística */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Logística</p>
                      <Popover
                        modal={false}
                        open={carrierFilterOpen}
                        onOpenChange={(open) => {
                          setCarrierFilterOpen(open);
                          if (open) {
                            setRegionFilterOpen(false);
                            setProductFilterOpen(false);
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-full justify-between gap-2 rounded-lg border-border/80 bg-input/50 px-3 font-normal shadow-inner shadow-black/[0.03]"
                            aria-expanded={carrierFilterOpen}
                          >
                            <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
                              <Truck className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                              <span className="truncate">
                                {carrier === "all"
                                  ? "Todas las logísticas"
                                  : carrierFilterOptions.find((o) => o.value === carrier)?.label ?? carrier}
                              </span>
                              <Badge variant="soft" className="ml-auto shrink-0 tabular-nums text-[10px]">
                                {carrier === "all"
                                  ? carrierFilterRows.length
                                  : carrierFilterOptions.find((o) => o.value === carrier)?.count ?? 0}
                              </Badge>
                            </span>
                            <ChevronDown className="size-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" sideOffset={6}>
                          <Command shouldFilter>
                            <CommandInput placeholder="Buscar transportadora…" className="h-9" />
                            <CommandList className="max-h-[220px]">
                              <CommandEmpty>Sin coincidencias.</CommandEmpty>
                              <CommandGroup>
                                {carrierFilterOptions.map((opt) => (
                                  <CommandItem
                                    key={`c-${opt.value}`}
                                    value={`${opt.label} ${opt.count}`}
                                    onSelect={() => {
                                      setCarrier(opt.value);
                                      setCarrierFilterOpen(false);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Truck className="mr-2 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                                    <span className="flex-1 truncate">{opt.label}</span>
                                    <span className="tabular-nums text-xs text-muted-foreground">{opt.count}</span>
                                    {carrier === opt.value ? <Check className="ml-2 size-4 shrink-0 text-primary" /> : null}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => {
                        setRegion("all");
                        setProduct("all");
                        setCarrier("all");
                      }}
                    >
                      Limpiar filtros
                    </Button>
                    <Button type="button" size="sm" onClick={() => setFiltersOpen(false)}>
                      Listo
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-8">
              <RefreshCw className="size-5 animate-spin" /> Cargando…
            </div>
          ) : filteredForMetrics.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Package className="size-10 opacity-30" />
              <p className="text-sm">No hay pedidos en este rango. Importa un archivo de guías compatible.</p>
            </div>
          ) : ordersListFiltered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <Search className="size-10 opacity-30" />
              <p className="text-sm font-medium text-foreground">Ningún pedido coincide</p>
              <p className="text-xs text-center max-w-sm">
                Prueba otras palabras en la búsqueda o abre <span className="font-medium text-foreground">Filtros</span>{" "}
                para ajustar región, producto o logística.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[560px]">
              <div className="space-y-3 pr-3">
                {ordersListFiltered.map((o) => {
                  const sale = o.product_sale_amount ?? 0;
                  const profit = o.profit ?? 0;
                  const ship = o.shipping_price ?? 0;
                  const cpaGeneral = metrics.cpa ?? 0;
                  const gananciaAprox = profit - cpaGeneral;
                  const margenPct = sale > 0 ? Math.round((gananciaAprox / sale) * 1000) / 10 : 0;
                  return (
                    <Card key={o.id}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <Badge variant={bucketVariant(o.status_bucket)}>
                              {BUCKET_LABEL[o.status_bucket] ?? o.status_bucket}
                            </Badge>
                            <div>
                              <div className="text-sm font-semibold text-foreground">
                                #{o.dropi_numeric_id}
                                {o.shop_order_number ? ` · Tienda ${o.shop_order_number}` : ""}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {o.order_date}{o.order_time ? ` · ${o.order_time}` : ""}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-success font-bold text-lg tabular-nums">{formatMoney(sale)}</div>
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Total venta</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm rounded-lg border border-border/40 bg-muted/20 p-3">
                          {[
                            { label: "Cliente", value: o.customer_name ?? "—" },
                            { label: "Tel", value: o.customer_phone ?? "—" },
                            { label: "Transp.", value: carrierKey(o) },
                            { label: "Región", value: regionKey(o) },
                            { label: "Producto", value: (o.categories ?? "").trim() || "Sin categoría" },
                            { label: "Guía", value: o.guide_number ?? "—" },
                          ].map((item) => (
                            <div key={item.label} className="text-muted-foreground">
                              <span className="text-xs">{item.label}:</span>{" "}
                              <span className="text-foreground font-medium">{item.value}</span>
                            </div>
                          ))}
                          <div className="text-muted-foreground md:col-span-2">
                            <span className="text-xs">Dirección:</span>{" "}
                            <span className="text-foreground font-medium">{o.address ?? "—"}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          <div className="rounded-lg border border-success/25 bg-success/8 p-2">
                            <div className="text-[10px] uppercase tracking-wide text-success/70 mb-0.5">Venta</div>
                            <div className="text-success font-bold tabular-nums">{formatMoney(sale)}</div>
                          </div>
                          <div className="rounded-lg border border-warning/25 bg-warning/8 p-2">
                            <div className="text-[10px] uppercase tracking-wide text-warning/70 mb-0.5">CPA general</div>
                            <div className="text-warning font-bold tabular-nums">{metrics.cpa != null ? formatMoney(cpaGeneral) : "—"}</div>
                          </div>
                          <div className={`rounded-lg border p-2 ${gananciaAprox >= 0 ? "border-primary/25 bg-primary/8" : "border-destructive/25 bg-destructive/8"}`}>
                            <div className={`text-[10px] uppercase tracking-wide mb-0.5 ${gananciaAprox >= 0 ? "text-primary/70" : "text-destructive/70"}`}>Ganancia aprox.</div>
                            <div className={`font-bold tabular-nums ${gananciaAprox >= 0 ? "text-primary" : "text-destructive"}`}>{formatMoney(gananciaAprox)}</div>
                          </div>
                          <div className="rounded-lg border border-border/40 bg-muted/30 p-2">
                            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Envío</div>
                            <div className="text-foreground font-bold tabular-nums">{formatMoney(ship)}</div>
                          </div>
                          <div className={`rounded-lg border p-2 ${margenPct >= 0 ? "border-info/25 bg-info/8" : "border-destructive/25 bg-destructive/8"}`}>
                            <div className={`text-[10px] uppercase tracking-wide mb-0.5 ${margenPct >= 0 ? "text-info/70" : "text-destructive/70"}`}>Margen</div>
                            <div className={`font-bold tabular-nums ${margenPct >= 0 ? "text-info" : "text-destructive"}`}>{sale > 0 ? `${margenPct}%` : "—"}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
          <p className="text-[11px] text-muted-foreground mt-3">
            <span className="font-semibold text-foreground/80">CPA general</span> = inversión Meta del rango / pedidos entregados.{" "}
            <span className="font-semibold text-foreground/80">Ganancia aprox.</span> = ganancia del pedido − CPA general.{" "}
            <span className="font-semibold text-foreground/80">Margen</span> = ganancia aprox. / venta.
          </p>
        </CardContent>
      </Card>

      {/* ── Dialog post-import ── */}
      <Dialog open={!!postImport?.open} onOpenChange={(o) => { if (!o) setPostImport(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="size-4 text-primary" />
              Confirma rango y gasto en Meta
            </DialogTitle>
            <DialogDescription>
              Detectamos las fechas del archivo. Ajusta si quieres y registra el gasto en Meta de ese mismo periodo:
              ROAS, CPA y precio sugerido se calculan con esos datos.
            </DialogDescription>
          </DialogHeader>
          {postImport && (
            <div className="space-y-4 mt-2">
              <div className="text-xs text-muted-foreground rounded-lg border border-border/40 bg-muted/20 p-3">
                Fechas detectadas en el archivo:{" "}
                <span className="font-medium text-foreground">{postImport.detectedFrom}</span> →{" "}
                <span className="font-medium text-foreground">{postImport.detectedTo}</span>{" "}
                · <span className="font-medium text-foreground">{postImport.rowsImported} filas</span> importadas.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NomaDatePicker
                  label="Fecha de inicio"
                  value={postImport.rangeFrom}
                  onChange={(v) => setPostImport((p) => (p ? { ...p, rangeFrom: v } : p))}
                  maxValue={postImport.rangeTo || undefined}
                  className="w-full"
                />
                <NomaDatePicker
                  label="Fecha de término"
                  value={postImport.rangeTo}
                  onChange={(v) => setPostImport((p) => (p ? { ...p, rangeTo: v } : p))}
                  minValue={postImport.rangeFrom || undefined}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                  Gasto en Meta para este rango (CLP) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Ej: 270000"
                  value={postImport.metaInput}
                  onChange={(e) => setPostImport((p) => (p ? { ...p, metaInput: e.target.value } : p))}
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Si no invertiste en Meta este periodo escribe 0. Es obligatorio para ROAS, CPA y precio sugerido.
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setPostImport(null)}>Recordar después</Button>
            <Button onClick={() => void confirmPostImport()}>Guardar gasto Meta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
