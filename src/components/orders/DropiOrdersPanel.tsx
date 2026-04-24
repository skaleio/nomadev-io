import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { parseDropiXlsxArrayBuffer, toSupabaseInsertRows } from "@/lib/dropiImport";
import {
  aggregateOrdersByRegion,
  attributedMetaSpend,
  computeDailyProfitTrend,
  computeDropiMetrics,
  computeTopProductInsight,
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
} from "lucide-react";
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

function minIso(a: string, b: string): string {
  return a <= b ? a : b;
}
function maxIso(a: string, b: string): string {
  return a >= b ? a : b;
}

const BUCKET_LABEL: Record<string, string> = {
  cancelled: "Cancelado",
  delivered: "Entregado",
  return_flow: "Devolución",
  issue: "Novedad",
  in_transit: "En tránsito",
  pending: "Pendiente",
};

function bucketBadgeClass(bucket: string) {
  switch (bucket) {
    case "delivered":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "cancelled":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "issue":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "return_flow":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    default:
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  }
}

interface DropiOrdersPanelProps {
  userId: string | undefined;
}

export function DropiOrdersPanel({ userId }: DropiOrdersPanelProps) {
  const [{ from: dateFrom, to: dateTo }, setRange] = useState(defaultRange);
  const [region, setRegion] = useState("all");
  const [product, setProduct] = useState("all");
  const [metaInput, setMetaInput] = useState("");
  const [orders, setOrders] = useState<DropiOrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [chartPeriodDays, setChartPeriodDays] = useState<1 | 7 | 14 | 30>(30);
  const [vizRegion, setVizRegion] = useState<string | null>(null);

  const filters: DropiMetricsFilters = useMemo(() => ({ region, product }), [region, product]);

  const chartBounds = useMemo(() => {
    const today = new Date();
    const chartTo = isoLocal(today);
    const start = new Date(today);
    start.setDate(start.getDate() - (chartPeriodDays - 1));
    const chartFrom = isoLocal(start);
    return { chartFrom, chartTo };
  }, [chartPeriodDays]);

  const fetchBounds = useMemo(() => {
    return {
      from: minIso(dateFrom, chartBounds.chartFrom),
      to: maxIso(dateTo, chartBounds.chartTo),
    };
  }, [dateFrom, dateTo, chartBounds.chartFrom, chartBounds.chartTo]);

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
      toast.error(e instanceof Error ? e.message : "No se pudieron cargar los pedidos Dropi");
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
    if (error) {
      console.warn(error);
      return;
    }
    if (data?.meta_ad_spend != null) setMetaInput(String(data.meta_ad_spend));
    else setMetaInput("");
  }, [userId, dateFrom, dateTo]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    void loadMetaSnapshot();
  }, [loadMetaSnapshot]);

  const ordersInMainRange = useMemo(
    () => orders.filter((o) => o.order_date >= dateFrom && o.order_date <= dateTo),
    [orders, dateFrom, dateTo],
  );

  const ordersForChartWindow = useMemo(
    () => orders.filter((o) => o.order_date >= chartBounds.chartFrom && o.order_date <= chartBounds.chartTo),
    [orders, chartBounds.chartFrom, chartBounds.chartTo],
  );

  const regionOptions = useMemo(() => {
    const set = new Set<string>();
    for (const o of ordersInMainRange) {
      set.add(
        (o.department ?? "").trim() ||
          (o.city ?? "").trim() ||
          "Sin región",
      );
    }
    return ["all", ...[...set].sort((a, b) => a.localeCompare(b, "es"))];
  }, [ordersInMainRange]);

  const productOptions = useMemo(() => {
    const set = new Set<string>();
    for (const o of ordersInMainRange) {
      const c = (o.categories ?? "").trim() || "Sin categoría";
      set.add(c);
    }
    return ["all", ...[...set].sort((a, b) => a.localeCompare(b, "es"))];
  }, [ordersInMainRange]);

  const filteredForMetrics = useMemo(
    () => filterDropiOrders(ordersInMainRange, filters),
    [ordersInMainRange, filters],
  );

  const ordersChartProductOnly = useMemo(
    () => filterDropiOrders(ordersForChartWindow, { region: "all", product }),
    [ordersForChartWindow, product],
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

  const topProductInsight = useMemo(() => {
    const label = metrics.topProducto?.label;
    if (!label) return null;
    return computeTopProductInsight(ordersInMainRange, filters, label, metaSpend);
  }, [ordersInMainRange, filters, metaSpend, metrics.topProducto?.label]);

  const saveMetaSpend = async () => {
    if (!userId) return;
    try {
      const { error } = await supabase.from("dropi_meta_spend_snapshots").upsert(
        {
          user_id: userId,
          period_start: dateFrom,
          period_end: dateTo,
          meta_ad_spend: metaSpend,
        },
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
      toast.error("Usa un archivo .xlsx de Dropi");
      return;
    }
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseDropiXlsxArrayBuffer(buf);
      if (!parsed.length) {
        toast.error("No se encontraron filas válidas (revisa ID y FECHA)");
        return;
      }

      const { data: imp, error: impErr } = await supabase
        .from("dropi_order_imports")
        .insert({
          user_id: userId,
          source_filename: file.name,
          row_count: parsed.length,
        })
        .select("id")
        .single();

      if (impErr || !imp) throw impErr ?? new Error("Import batch");

      const rows = toSupabaseInsertRows(userId, imp.id, parsed);
      const chunk = 120;
      for (let i = 0; i < rows.length; i += chunk) {
        const part = rows.slice(i, i + chunk);
        const { error: upErr } = await supabase.from("dropi_orders").upsert(part, {
          onConflict: "user_id,dropi_numeric_id",
        });
        if (upErr) throw upErr;
      }

      toast.success(`Importadas ${parsed.length} filas. Los IDs Dropi se actualizan si ya existían.`);
      await loadOrders();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Error importando");
    } finally {
      setImporting(false);
    }
  };

  if (!userId) {
    return (
      <Card className="bg-gray-900/50 border-gray-700">
        <CardContent className="p-6 text-gray-400">Inicia sesión para importar pedidos Dropi.</CardContent>
      </Card>
    );
  }

  const total = metrics.totalPedidos;
  const c = metrics.counts;
  const pct = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : "0%");

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2 text-lg">
            <Upload className="w-5 h-5" />
            Importar guías Dropi (.xlsx)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Desde (FECHA pedido)</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white w-40"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Hasta</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white w-40"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Región (departamento)</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm min-w-[200px]"
            >
              {regionOptions.map((r) => (
                <option key={r} value={r}>
                  {r === "all" ? "Todas las regiones" : r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Producto / categoría</label>
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white text-sm min-w-[220px]"
            >
              {productOptions.map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? "Todos los productos" : p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Archivo</label>
            <Input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => void onFile(e)}
              disabled={importing}
              className="bg-gray-800 border-gray-600 text-white max-w-xs"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadOrders()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Recargar
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Megaphone className="w-5 h-5" />
            Inversión Meta (gasto en ads)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Monto CLP (este rango de fechas)</label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="Ej: 270000"
              value={metaInput}
              onChange={(e) => setMetaInput(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white w-48"
            />
          </div>
          <Button size="sm" variant="secondary" onClick={() => void saveMetaSpend()}>
            Guardar gasto
          </Button>
          <p className="text-xs text-gray-500 max-w-xl">
            ROAS y CPA usan este monto. No viene en el Excel de Dropi; lo guardamos por rango para que las métricas
            sean reproducibles.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard
          title="Total vendido"
          value={formatMoney(metrics.totalVendido)}
          icon={DollarSign}
          color="primary"
          description="Suma valor compra productos, excl. cancelados / anulados"
          loading={loading}
        />
        <MetricCard
          title="Facturación confirmados"
          value={formatMoney(metrics.facturacionConfirmados)}
          icon={BarChart3}
          color="primary"
          description="Solo filas con factura o valor facturado (si el export viene vacío, 0)"
          loading={loading}
        />
        <MetricCard
          title="Ganancia real"
          value={formatMoney(metrics.gananciaReal)}
          icon={TrendingUp}
          color="success"
          description="Suma GANANCIA solo pedidos entregados"
          loading={loading}
        />
        <MetricCard
          title="Ganancia estimada"
          value={formatMoney(metrics.gananciaEstimada)}
          icon={TrendingUp}
          color="warning"
          description="Suma GANANCIA en todos los no cancelados"
          loading={loading}
        />
        <MetricCard
          title="Ganancia promedio"
          value={formatMoney(metrics.gananciaPromedioEntregado)}
          icon={Target}
          color="primary"
          description="Por pedido entregado"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Inversión Meta"
          value={formatMoney(metrics.inversionMeta)}
          icon={Megaphone}
          color="warning"
          description="Gasto en ads (manual)"
          loading={loading}
        />
        <MetricCard
          title="ROAS facturación"
          value={formatRoas(metrics.roasFacturacion)}
          icon={BarChart3}
          color="primary"
          description="Facturación confirmados / ads"
          loading={loading}
        />
        <MetricCard
          title="ROAS real"
          value={formatRoas(metrics.roasReal)}
          icon={TrendingUp}
          color="success"
          description="Ganancia real / ads"
          loading={loading}
        />
        <MetricCard
          title="CPA"
          value={
            metrics.cpa != null ? formatMoney(metrics.cpa) : "—"
          }
          icon={Target}
          color="primary"
          description="Ads / pedidos entregados"
          loading={loading}
        />
        <MetricCard
          title="AOV"
          value={formatMoney(metrics.aov)}
          icon={Package}
          color="primary"
          description="Ticket promedio (total vendido / pedidos no cancelados)"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricCard title="Total pedidos" value={String(metrics.totalPedidos)} icon={Package} loading={loading} />
        <MetricCard
          title="Confirmados *"
          value={`${c.confirmados} (${pct(c.confirmados)})`}
          icon={BarChart3}
          description="En tránsito / reparto (proxy operativo)"
          loading={loading}
        />
        <MetricCard
          title="Entregados"
          value={`${c.entregados} (${pct(c.entregados)})`}
          icon={TrendingUp}
          color="success"
          loading={loading}
        />
        <MetricCard
          title="Pendientes"
          value={`${c.pendientes} (${pct(c.pendientes)})`}
          icon={Target}
          loading={loading}
        />
        <MetricCard
          title="Novedades"
          value={`${c.novedades} (${pct(c.novedades)})`}
          icon={BarChart3}
          color="warning"
          loading={loading}
        />
        <MetricCard
          title="En devolución"
          value={`${c.enDevolucion} (${pct(c.enDevolucion)})`}
          icon={Package}
          color="destructive"
          loading={loading}
        />
        <MetricCard
          title="Cancelados"
          value={`${c.cancelados} (${pct(c.cancelados)})`}
          icon={Package}
          color="destructive"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="% Ganancia real"
          value={`${metrics.pctGananciaReal}%`}
          icon={Percent}
          color="success"
          description="Ganancia bruta sobre ventas de pedidos entregados"
          loading={loading}
        />
        <MetricCard
          title="% Ganancia estimada"
          value={`${metrics.pctGananciaEstimada}%`}
          icon={Percent}
          color="warning"
          description="Ganancia bruta sobre ventas de pedidos no cancelados"
          loading={loading}
        />
        <MetricCard
          title="Top región entregados"
          value={metrics.topRegionEntregados?.label ?? "—"}
          icon={MapPin}
          color="primary"
          description={
            metrics.topRegionEntregados
              ? `${metrics.topRegionEntregados.count} entregados`
              : "Sin entregados en el filtro"
          }
          loading={loading}
        />
      </div>

      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-white">Tendencia de ganancias</CardTitle>
          <div className="flex flex-wrap gap-2">
            {([1, 7, 14, 30] as const).map((d) => (
              <Button
                key={d}
                size="sm"
                variant={chartPeriodDays === d ? "secondary" : "outline"}
                className={chartPeriodDays === d ? "bg-gray-700" : ""}
                onClick={() => setChartPeriodDays(d)}
              >
                {d === 1 ? "Hoy" : `${d} días`}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="h-[320px] text-gray-300">
          {profitTrend.length === 0 ? (
            <p className="text-gray-500 text-sm py-12 text-center">Sin datos en este periodo del gráfico.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={profitTrend.map((p) => ({
                  ...p,
                  fecha: new Date(p.date + "T12:00:00").toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "short",
                  }),
                }))}
                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="fecha" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 11 }}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(value: number) => [formatMoney(value), ""]}
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #4b5563" }}
                  labelStyle={{ color: "#e5e7eb" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="gananciaReal"
                  name="Ganancia real (entregados)"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="gananciaEstimada"
                  name="Ganancia estimada (no cancel.)"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Periodo del gráfico: {chartBounds.chartFrom} → {chartBounds.chartTo} (según filtro de producto; todas las
            regiones).
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-white">Pedidos por región</CardTitle>
          {vizRegion && (
            <Button size="sm" variant="ghost" className="text-gray-400" onClick={() => setVizRegion(null)}>
              Quitar selección
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {regionBars.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin datos para el periodo del gráfico y producto seleccionado.</p>
          ) : (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={regionBars}
                  margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                  onClick={(s) => {
                    const p = s?.activePayload?.[0]?.payload as { region?: string } | undefined;
                    if (p?.region) setVizRegion((prev) => (prev === p.region ? null : p.region));
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="region" tick={{ fill: "#9ca3af", fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={72} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(55,65,81,0.35)" }}
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #4b5563" }}
                    labelStyle={{ color: "#e5e7eb" }}
                  />
                  <Bar dataKey="count" name="Pedidos" radius={[4, 4, 0, 0]}>
                    {regionBars.map((entry) => (
                      <Cell
                        key={entry.region}
                        fill={vizRegion === entry.region ? "#34d399" : "#6b7280"}
                        className="cursor-pointer"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-xs text-gray-500">
            Clic en una barra para ver KPIs de esa región (mismo periodo del gráfico de tendencia y filtro de producto).
            Meta se reparte proporcionalmente al volumen de pedidos.
          </p>

          {vizRegion && regionVizMetrics && (
            <div className="space-y-3 border-t border-gray-700 pt-4">
              <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" /> {vizRegion}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <MetricCard title="Pedidos" value={String(regionVizMetrics.totalPedidos)} icon={Package} loading={loading} />
                <MetricCard
                  title="Total vendido"
                  value={formatMoney(regionVizMetrics.totalVendido)}
                  icon={DollarSign}
                  loading={loading}
                />
                <MetricCard
                  title="Ganancia real"
                  value={formatMoney(regionVizMetrics.gananciaReal)}
                  icon={TrendingUp}
                  color="success"
                  loading={loading}
                />
                <MetricCard
                  title="Ganancia est."
                  value={formatMoney(regionVizMetrics.gananciaEstimada)}
                  icon={TrendingUp}
                  color="warning"
                  loading={loading}
                />
                <MetricCard title="ROAS real" value={formatRoas(regionVizMetrics.roasReal)} icon={BarChart3} loading={loading} />
                <MetricCard
                  title="CPA"
                  value={regionVizMetrics.cpa != null ? formatMoney(regionVizMetrics.cpa) : "—"}
                  icon={Target}
                  loading={loading}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {topProductInsight && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Producto #1 — {topProductInsight.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Pedidos</span>
                <span className="text-white font-medium">{topProductInsight.pedidos}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Precio promedio</span>
                <span className="text-white font-medium">{formatMoney(topProductInsight.precioPromedio)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Entrega</span>
                <span className="text-white font-medium">{topProductInsight.pctEntregados}%</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Confirmación *</span>
                <span className="text-white font-medium">{topProductInsight.pctConfirmados}%</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Devolución</span>
                <span className="text-white font-medium">{topProductInsight.pctDevolucion}%</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Cancelados</span>
                <span className="text-white font-medium">{topProductInsight.pctCancelados}%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              * Confirmación = pedidos en tránsito / reparto (proxy operativo Dropi). Categorías según columna CATEGORÍAS
              del Excel.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="Breakeven / pedido"
                value={
                  topProductInsight.breakevenPorPedido != null
                    ? formatMoney(topProductInsight.breakevenPorPedido)
                    : "—"
                }
                icon={Scale}
                description="Coste variable medio entregado + Meta prorrateada / entregado"
                loading={loading}
              />
              <MetricCard
                title="Profit neto / pedido"
                value={
                  topProductInsight.profitNetoPorPedido != null
                    ? formatMoney(topProductInsight.profitNetoPorPedido)
                    : "—"
                }
                icon={DollarSign}
                color="success"
                description="Ganancia media entregado − Meta prorrateada por entregado"
                loading={loading}
              />
              <MetricCard
                title="Precio sugerido"
                value={
                  topProductInsight.precioSugerido != null
                    ? formatMoney(topProductInsight.precioSugerido)
                    : "—"
                }
                icon={Target}
                description="Breakeven × 1,30 (margen orientativo)"
                loading={loading}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-900/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Pedidos ({filteredForMetrics.length} con filtros)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-8">
              <RefreshCw className="w-6 h-6 animate-spin" /> Cargando…
            </div>
          ) : filteredForMetrics.length === 0 ? (
            <p className="text-gray-400 py-8 text-center">No hay pedidos en este rango. Importa un .xlsx de Dropi.</p>
          ) : (
            <ScrollArea className="h-[480px]">
              <div className="space-y-3 pr-3">
                {filteredForMetrics.map((o) => (
                  <Card key={o.id} className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-4 flex flex-wrap justify-between gap-2">
                      <div>
                        <div className="text-white font-semibold">
                          #{o.dropi_numeric_id}{" "}
                          {o.shop_order_number ? `· Tienda ${o.shop_order_number}` : ""}
                        </div>
                        <div className="text-sm text-gray-400">
                          {o.customer_name ?? "—"} · {o.order_date}
                        </div>
                        <div className="text-sm text-gray-500">
                          {[o.department, o.city].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-white font-medium">{formatMoney(o.product_sale_amount ?? 0)}</div>
                        <div className="text-xs text-gray-400">Ganancia: {formatMoney(o.profit ?? 0)}</div>
                        <Badge className={`border ${bucketBadgeClass(o.status_bucket)}`}>
                          {BUCKET_LABEL[o.status_bucket] ?? o.status_bucket}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
