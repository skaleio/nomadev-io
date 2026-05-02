import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NomaDatePicker } from "@/components/ui/noma-date-picker";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MetricCard } from "@/features/dashboard/components/MetricCard";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { parseDropiXlsxArrayBuffer, toSupabaseInsertRows } from "@/features/dropi/lib/dropiImport";
import {
  clearDropiActiveImportId,
  readDropiActiveImportId,
  readDropiSessionPrefs,
  writeDropiActiveImportId,
  writeDropiSessionPrefs,
  type DropiPanelSessionPrefsV1,
} from "@/features/dropi/lib/dropiSessionPrefs";
import {
  aggregateOrdersByRegion,
  aggregateOrdersByRegionStatusStack,
  aggregateDeliveryDaysByRegion,
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
} from "@/features/dropi/lib/computeDropiMetrics";
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
  History,
  FileSpreadsheet,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

type OrderStatusBucket =
  | "all"
  | "in_transit"
  | "delivered"
  | "pending"
  | "issue"
  | "return_flow"
  | "cancelled";

const STATUS_METRIC_MODAL_TITLE: Record<OrderStatusBucket, string> = {
  all: "Todos los pedidos",
  in_transit: "Confirmados (en tránsito / reparto)",
  delivered: "Entregados",
  pending: "Pendientes",
  issue: "Novedades",
  return_flow: "En devolución",
  cancelled: "Cancelados",
};

type FinancialMetricKey =
  | "total_vendido"
  | "ganancia_real"
  | "ganancia_estimada"
  | "ganancia_promedio"
  | "inversion_meta"
  | "roas_ventas"
  | "roas_real"
  | "cpa"
  | "aov"
  | "pct_ganancia_real"
  | "pct_ganancia_estimada"
  | "top_region"
  | "vista_producto";

const FINANCIAL_METRIC_MODAL_TITLE: Record<FinancialMetricKey, string> = {
  total_vendido: "Total vendido — detalle",
  ganancia_real: "Ganancia real — pedidos entregados",
  ganancia_estimada: "Ganancia estimada — no cancelados",
  ganancia_promedio: "Ganancia promedio — por entregado",
  inversion_meta: "Inversión Meta",
  roas_ventas: "ROAS ventas — desglose",
  roas_real: "ROAS real — desglose",
  cpa: "CPA — base de pedidos entregados",
  aov: "Ticket promedio (AOV)",
  pct_ganancia_real: "% Ganancia real",
  pct_ganancia_estimada: "% Ganancia estimada",
  top_region: "Top región — entregados",
  vista_producto: "Vista por producto",
};

type PanelOrdersModal = { source: "status"; bucket: OrderStatusBucket } | { source: "metric"; metric: FinancialMetricKey };

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
  const [statusBucket, setStatusBucket] = useState<OrderStatusBucket>("all");
  const [metaInput, setMetaInput] = useState("");
  const [orders, setOrders] = useState<DropiOrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStage, setImportStage] = useState<string | null>(null);
  const [dragOverImport, setDragOverImport] = useState(false);
  const [chartPeriodDays, setChartPeriodDays] = useState<1 | 7 | 14 | 30>(30);
  const [vizRegion, setVizRegion] = useState<string | null>(null);
  const [regionChartBucket, setRegionChartBucket] = useState<
    "all" | "delivered" | "return_flow" | "cancelled" | "in_transit"
  >("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [regionFilterOpen, setRegionFilterOpen] = useState(false);
  const [productFilterOpen, setProductFilterOpen] = useState(false);
  const [carrierFilterOpen, setCarrierFilterOpen] = useState(false);
  const [clientQuery, setClientQuery] = useState("");
  /** Modal con guías al hacer clic en tarjetas de métricas o estado. */
  const [panelOrdersModal, setPanelOrdersModal] = useState<PanelOrdersModal | null>(null);
  /** Si true, al cerrar el modal se quita el filtro de estado de la lista (solo aplica a tarjetas de estado). */
  const resetStatusFilterOnModalCloseRef = useRef(false);
  /** Oculta el bloque de importación (persiste en sessionStorage hasta cerrar sesión / pestaña). */
  const [importCardCollapsed, setImportCardCollapsed] = useState(false);
  /** Categorías extra solo para el gráfico de demora por región (vacío = usa el filtro de producto del panel). */
  const [deliveryLagCategoryKeys, setDeliveryLagCategoryKeys] = useState<string[]>([]);
  const [deliveryLagFilterOpen, setDeliveryLagFilterOpen] = useState(false);
  /** Evita escribir prefs por defecto antes de leer la sesión guardada. */
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const [postImport, setPostImport] = useState<{
    open: boolean;
    detectedFrom: string;
    detectedTo: string;
    rangeFrom: string;
    rangeTo: string;
    metaInput: string;
    rowsImported: number;
  } | null>(null);
  /** Id del `dropi_order_imports` actualmente cargado en el panel. null = panel vacío. */
  const [activeImportId, setActiveImportId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  type ImportHistoryRow = Pick<Tables<"dropi_order_imports">, "id" | "source_filename" | "row_count" | "created_at">;
  const [importHistory, setImportHistory] = useState<ImportHistoryRow[]>([]);
  const [importPendingDelete, setImportPendingDelete] = useState<ImportHistoryRow | null>(null);
  const [deleteImportBusy, setDeleteImportBusy] = useState(false);

  const filters: DropiMetricsFilters = useMemo(() => ({ region, product, carrier }), [region, product, carrier]);

  const chartBounds = useMemo(() => {
    // El gráfico debe respetar el rango elegido por el usuario.
    // Usamos `dateTo` como fin y recortamos hacia atrás según `chartPeriodDays`,
    // sin salirnos de `dateFrom`.
    const to = dateTo ? new Date(dateTo + "T12:00:00") : new Date();
    const chartTo = isoLocal(to);
    const start = new Date(to);
    start.setDate(start.getDate() - (chartPeriodDays - 1));
    const chartFrom = maxIso(isoLocal(start), dateFrom);
    return { chartFrom, chartTo };
  }, [chartPeriodDays, dateFrom, dateTo]);

  const fetchBounds = useMemo(() => ({
    from: minIso(dateFrom, chartBounds.chartFrom),
    to: maxIso(dateTo, chartBounds.chartTo),
  }), [dateFrom, dateTo, chartBounds.chartFrom, chartBounds.chartTo]);

  const loadOrders = useCallback(async () => {
    if (!userId) return;
    // Sin import activo: panel vacío hasta que el usuario suba una guía o cargue una del historial.
    if (!activeImportId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("dropi_orders")
        .select("*")
        .eq("user_id", userId)
        .eq("import_id", activeImportId)
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
  }, [userId, activeImportId, fetchBounds.from, fetchBounds.to]);

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
    if (spend != null) {
      setMetaInput(String(spend));
      return;
    }
    const prefs = readDropiSessionPrefs(userId);
    if (prefs && prefs.dateFrom === dateFrom && prefs.dateTo === dateTo && prefs.metaInput.trim() !== "") {
      setMetaInput(prefs.metaInput);
    } else {
      setMetaInput("");
    }
  }, [userId, dateFrom, dateTo]);

  useEffect(() => {
    if (!userId) {
      setSessionHydrated(false);
      setActiveImportId(null);
      return;
    }
    const saved = readDropiSessionPrefs(userId);
    if (saved) {
      setRange({ from: saved.dateFrom, to: saved.dateTo });
      setRegion(typeof saved.region === "string" ? saved.region : "all");
      setProduct(typeof saved.product === "string" ? saved.product : "all");
      setCarrier(typeof saved.carrier === "string" ? saved.carrier : "all");
      const cp = saved.chartPeriodDays;
      setChartPeriodDays(cp === 1 || cp === 7 || cp === 14 || cp === 30 ? cp : 30);
      setImportCardCollapsed(!!saved.importCardCollapsed);
      if (typeof saved.metaInput === "string") setMetaInput(saved.metaInput);
    }
    setActiveImportId(readDropiActiveImportId(userId));
    setSessionHydrated(true);
  }, [userId]);

  useEffect(() => {
    if (!userId || !sessionHydrated) return;
    void loadOrders();
  }, [userId, sessionHydrated, loadOrders]);

  useEffect(() => {
    if (!userId || !sessionHydrated) return;
    void loadMetaSnapshot();
  }, [userId, sessionHydrated, loadMetaSnapshot]);

  useEffect(() => {
    if (!userId || !sessionHydrated) return;
    const prefs: DropiPanelSessionPrefsV1 = {
      v: 1,
      dateFrom,
      dateTo,
      region,
      product,
      carrier,
      metaInput,
      chartPeriodDays,
      importCardCollapsed,
    };
    writeDropiSessionPrefs(userId, prefs);
  }, [userId, sessionHydrated, dateFrom, dateTo, region, product, carrier, metaInput, chartPeriodDays, importCardCollapsed]);

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
    const statusFiltered =
      statusBucket === "all" ? filteredForMetrics : filteredForMetrics.filter((o) => o.status_bucket === statusBucket);
    if (!q) return statusFiltered;
    return statusFiltered.filter((o) => {
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
  }, [filteredForMetrics, clientQuery, statusBucket]);

  const ordersChartProductOnly = useMemo(
    () => filterDropiOrders(ordersForChartWindow, { region: "all", product, carrier }),
    [ordersForChartWindow, product, carrier],
  );

  /** Categorías disponibles en el periodo del gráfico (para filtro multiselect del gráfico de demora). */
  const deliveryLagCategoryOptions = useMemo(() => {
    const base = filterDropiOrders(ordersForChartWindow, { region: "all", product: "all", carrier });
    const map = new Map<string, number>();
    for (const o of base) {
      const k = (o.categories ?? "").trim() || "Sin categoría";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "es"))
      .map(([name, count]) => ({ value: name, label: name, count }));
  }, [ordersForChartWindow, carrier]);

  const ordersForDeliveryLagChart = useMemo(() => {
    if (deliveryLagCategoryKeys.length === 0) return ordersChartProductOnly;
    const set = new Set(deliveryLagCategoryKeys);
    return filterDropiOrders(ordersForChartWindow, { region: "all", product: "all", carrier }).filter((o) => {
      const cat = (o.categories ?? "").trim() || "Sin categoría";
      return set.has(cat);
    });
  }, [ordersChartProductOnly, ordersForChartWindow, carrier, deliveryLagCategoryKeys]);

  const regionChartOrders = useMemo(() => {
    if (regionChartBucket === "all") return ordersChartProductOnly;
    return ordersChartProductOnly.filter((o) => o.status_bucket === regionChartBucket);
  }, [ordersChartProductOnly, regionChartBucket]);

  const profitTrend = useMemo(
    () => computeDailyProfitTrend(ordersChartProductOnly, chartBounds.chartFrom, chartBounds.chartTo),
    [ordersChartProductOnly, chartBounds.chartFrom, chartBounds.chartTo],
  );

  const regionBars = useMemo(() => aggregateOrdersByRegion(regionChartOrders), [regionChartOrders]);

  /** Base para vista “Todos”: mismos pedidos que el periodo del gráfico (producto + logística). */
  const regionBarsStacked = useMemo(
    () => aggregateOrdersByRegionStatusStack(ordersChartProductOnly),
    [ordersChartProductOnly],
  );

  const regionStackShowsOther = useMemo(() => regionBarsStacked.some((r) => r.other > 0), [regionBarsStacked]);

  const deliveryDaysByRegion = useMemo(
    () => aggregateDeliveryDaysByRegion(ordersForDeliveryLagChart),
    [ordersForDeliveryLagChart],
  );

  const deliveryLagYAxisMax = useMemo(() => {
    if (deliveryDaysByRegion.length === 0) return 10;
    const max = Math.max(...deliveryDaysByRegion.map((r) => r.avgDays), 0);
    const step = 5;
    return Math.max(step, Math.ceil(max / step) * step);
  }, [deliveryDaysByRegion]);

  const deliveryLagYTicks = useMemo(() => {
    const n = deliveryLagYAxisMax / 5;
    const ticks: number[] = [];
    for (let i = 0; i <= n; i++) ticks.push(i * 5);
    return ticks;
  }, [deliveryLagYAxisMax]);

  const regionBucketCounts = useMemo(() => {
    const base = ordersChartProductOnly;
    return {
      all: base.length,
      delivered: base.filter((o) => o.status_bucket === "delivered").length,
      return_flow: base.filter((o) => o.status_bucket === "return_flow").length,
      cancelled: base.filter((o) => o.status_bucket === "cancelled").length,
      in_transit: base.filter((o) => o.status_bucket === "in_transit").length,
    };
  }, [ordersChartProductOnly]);

  const regionChartTitle = useMemo(() => {
    switch (regionChartBucket) {
      case "delivered": return "Entregas por región";
      case "return_flow": return "Devoluciones por región";
      case "cancelled": return "Cancelados por región";
      case "in_transit": return "En tránsito por región";
      default: return "Pedidos por región";
    }
  }, [regionChartBucket]);

  /** Colores alineados al gráfico apilado y a los recuadros de filtro. */
  const regionStatusChartColors = useMemo(
    () => ({
      delivered: "hsl(var(--success))",
      in_transit: "hsl(199 89% 48%)",
      return_flow: "hsl(38 92% 50%)",
      cancelled: "hsl(var(--destructive))",
      other: "hsl(var(--muted-foreground) / 0.65)",
    }),
    [],
  );

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

  const panelModalOrders = useMemo(() => {
    if (!panelOrdersModal) return [];
    if (panelOrdersModal.source === "status") {
      const { bucket } = panelOrdersModal;
      if (bucket === "all") return filteredForMetrics;
      return filteredForMetrics.filter((o) => o.status_bucket === bucket);
    }
    const nonCancelled = filteredForMetrics.filter((o) => o.status_bucket !== "cancelled");
    const delivered = filteredForMetrics.filter((o) => o.status_bucket === "delivered");
    switch (panelOrdersModal.metric) {
      case "total_vendido":
      case "ganancia_estimada":
      case "aov":
      case "pct_ganancia_estimada":
      case "roas_ventas":
        return nonCancelled;
      case "ganancia_real":
      case "ganancia_promedio":
      case "cpa":
      case "roas_real":
      case "pct_ganancia_real":
      case "inversion_meta":
        return delivered;
      case "top_region": {
        const label = metrics.topRegionEntregados?.label;
        if (!label) return [];
        return delivered.filter((o) => {
          const d = (o.department ?? "").trim();
          const c = (o.city ?? "").trim();
          const key = d || c || "Sin región";
          return key === label;
        });
      }
      case "vista_producto":
        return filteredForMetrics;
      default:
        return [];
    }
  }, [panelOrdersModal, filteredForMetrics, metrics]);

  const panelModalTitle = useMemo(() => {
    if (!panelOrdersModal) return "";
    if (panelOrdersModal.source === "status") return STATUS_METRIC_MODAL_TITLE[panelOrdersModal.bucket];
    return FINANCIAL_METRIC_MODAL_TITLE[panelOrdersModal.metric];
  }, [panelOrdersModal]);

  /** Desglose numérico por métrica (ROAS, CPA, %, etc.) para diferenciar cada ventana emergente. */
  const panelModalBreakdown = useMemo((): React.ReactNode => {
    if (!panelOrdersModal || panelOrdersModal.source !== "metric") return null;

    const sale = (o: DropiOrderRow) => o.product_sale_amount ?? 0;
    const delivered = filteredForMetrics.filter((o) => o.status_bucket === "delivered");
    const nonCancelled = filteredForMetrics.filter((o) => o.status_bucket !== "cancelled");
    const entN = delivered.length;
    const nonCN = nonCancelled.length;
    const ventasEnt = delivered.reduce((s, o) => s + sale(o), 0);
    const ventasNC = nonCancelled.reduce((s, o) => s + sale(o), 0);
    const inv = metrics.inversionMeta;

    const BreakRow = ({
      label,
      value,
      hint,
    }: {
      label: string;
      value: string;
      hint?: string;
    }) => (
      <div className="flex flex-col gap-0.5 border-b border-border/50 py-2.5 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <span className="text-sm text-muted-foreground">{label}</span>
          {hint ? <p className="text-xs text-muted-foreground/85 mt-0.5 leading-snug">{hint}</p> : null}
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground sm:text-right">{value}</span>
      </div>
    );

    const ResultBanner = ({ label, result, formula }: { label: string; result: string; formula: string }) => (
      <div className="mt-3 rounded-lg border border-primary/25 bg-primary/[0.08] px-3 py-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-lg font-bold tabular-nums text-primary">{result}</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed font-mono break-all">{formula}</p>
      </div>
    );

    const warn = (msg: string) => (
      <div className="rounded-xl border border-amber-500/35 bg-amber-500/[0.12] px-4 py-3 text-sm text-amber-100 leading-relaxed">
        {msg}
      </div>
    );

    switch (panelOrdersModal.metric) {
      case "roas_ventas": {
        if (inv <= 0) return warn("Ingresa y guarda un monto de inversión Meta mayor a cero. ROAS ventas = total vendido ÷ ese gasto.");
        return (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">ROAS ventas</p>
            <p className="text-[11px] text-muted-foreground mb-2">Indica cuántas veces se recupera el gasto en ads con el volumen vendido (sin cancelados).</p>
            <BreakRow label="Numerador · total vendido" value={formatMoney(metrics.totalVendido)} hint={`Suma de “valor venta” en ${nonCN} pedido(s) no cancelado(s)`} />
            <BreakRow label="Denominador · inversión Meta" value={formatMoney(inv)} hint="Gasto en anuncios manual del rango" />
            <ResultBanner
              label="Resultado"
              result={formatRoas(metrics.roasVentas)}
              formula={`${formatMoney(metrics.totalVendido)} ÷ ${formatMoney(inv)} = ${formatRoas(metrics.roasVentas)}`}
            />
          </div>
        );
      }
      case "roas_real": {
        if (inv <= 0) return warn("Sin inversión Meta no hay ROAS real. Es ganancia real (solo entregados) ÷ gasto en ads.");
        if (entN === 0) return warn("No hay entregados en el filtro: la ganancia real es 0 y el ROAS real no aplica.");
        return (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">ROAS real</p>
            <p className="text-[11px] text-muted-foreground mb-2">Relaciona la ganancia que ya materializaste (entregados) con el gasto en Meta.</p>
            <BreakRow label="Numerador · ganancia real" value={formatMoney(metrics.gananciaReal)} hint={`Suma de “ganancia” del Excel en ${entN} entregado(s)`} />
            <BreakRow label="Denominador · inversión Meta" value={formatMoney(inv)} />
            <ResultBanner
              label="Resultado"
              result={formatRoas(metrics.roasReal)}
              formula={`${formatMoney(metrics.gananciaReal)} ÷ ${formatMoney(inv)} = ${formatRoas(metrics.roasReal)}`}
            />
          </div>
        );
      }
      case "cpa": {
        if (inv <= 0) return warn("CPA = inversión Meta ÷ pedidos entregados. Añade el gasto en ads.");
        if (entN === 0) return warn("No hay entregados: no se puede repartir el gasto por pedido.");
        const cpa = metrics.cpa;
        return (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">CPA (coste por pedido entregado)</p>
            <p className="text-[11px] text-muted-foreground mb-2">Cuánto te costó en ads cada entrega del periodo (en promedio).</p>
            <BreakRow label="Dividendo · inversión Meta" value={formatMoney(inv)} />
            <BreakRow label="Divisor · entregados" value={String(entN)} hint="Pedidos con estado entregado en el filtro" />
            <ResultBanner
              label="Resultado"
              result={cpa != null ? formatMoney(cpa) : "—"}
              formula={cpa != null ? `${formatMoney(inv)} ÷ ${entN} = ${formatMoney(cpa)}` : "—"}
            />
          </div>
        );
      }
      case "aov": {
        if (nonCN === 0) return warn("No hay pedidos no cancelados: el ticket promedio no aplica.");
        return (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">AOV (ticket promedio)</p>
            <p className="text-[11px] text-muted-foreground mb-2">Venta media por pedido que cuenta en “total vendido”.</p>
            <BreakRow label="Total vendido" value={formatMoney(metrics.totalVendido)} />
            <BreakRow label="Pedidos (no cancelados)" value={String(nonCN)} />
            <ResultBanner
              label="Resultado"
              result={formatMoney(metrics.aov)}
              formula={`${formatMoney(metrics.totalVendido)} ÷ ${nonCN} = ${formatMoney(metrics.aov)}`}
            />
          </div>
        );
      }
      case "ganancia_promedio": {
        if (entN === 0) return warn("Sin entregados no hay promedio de ganancia por entregado.");
        return (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Ganancia promedio por entregado</p>
            <BreakRow label="Ganancia real (suma)" value={formatMoney(metrics.gananciaReal)} />
            <BreakRow label="Cantidad de entregados" value={String(entN)} />
            <ResultBanner
              label="Resultado"
              result={formatMoney(metrics.gananciaPromedioEntregado)}
              formula={`${formatMoney(metrics.gananciaReal)} ÷ ${entN} = ${formatMoney(metrics.gananciaPromedioEntregado)}`}
            />
          </div>
        );
      }
      case "pct_ganancia_real": {
        if (entN === 0 || ventasEnt <= 0) return warn("Hacen falta entregados con venta mayor que cero para este porcentaje.");
        return (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">% Ganancia real</p>
            <p className="text-[11px] text-muted-foreground mb-2">Ganancia bruta respecto al dinero facturado solo en entregados.</p>
            <BreakRow label="Ganancia real" value={formatMoney(metrics.gananciaReal)} />
            <BreakRow label="Ventas (solo entregados)" value={formatMoney(ventasEnt)} hint={`Suma de venta en ${entN} entregado(s)`} />
            <ResultBanner
              label="Resultado"
              result={`${metrics.pctGananciaReal}%`}
              formula={`(${formatMoney(metrics.gananciaReal)} ÷ ${formatMoney(ventasEnt)}) × 100 ≈ ${metrics.pctGananciaReal}%`}
            />
          </div>
        );
      }
      case "pct_ganancia_estimada": {
        if (nonCN === 0 || ventasNC <= 0) return warn("Hacen falta pedidos no cancelados con venta para este porcentaje.");
        return (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">% Ganancia estimada</p>
            <p className="text-[11px] text-muted-foreground mb-2">Ganancia bruta sobre ventas de todos los pedidos que no están cancelados.</p>
            <BreakRow label="Ganancia estimada (suma)" value={formatMoney(metrics.gananciaEstimada)} />
            <BreakRow label="Ventas (no cancelados)" value={formatMoney(ventasNC)} hint={`${nonCN} pedido(s)`} />
            <ResultBanner
              label="Resultado"
              result={`${metrics.pctGananciaEstimada}%`}
              formula={`(${formatMoney(metrics.gananciaEstimada)} ÷ ${formatMoney(ventasNC)}) × 100 ≈ ${metrics.pctGananciaEstimada}%`}
            />
          </div>
        );
      }
      case "total_vendido": {
        if (nonCN === 0) return warn("No hay pedidos no cancelados en el filtro.");
        return (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Total vendido</p>
            <p className="text-[11px] text-muted-foreground mb-2">Suma aritmética del valor de compra en productos; excluye cancelados.</p>
            <BreakRow label="Pedidos incluidos" value={String(nonCN)} hint="Estados distintos de cancelado" />
            <BreakRow label="Suma de ventas" value={formatMoney(metrics.totalVendido)} hint="Una fila por pedido en la lista inferior" />
          </div>
        );
      }
      case "ganancia_real": {
        if (entN === 0) return warn("No hay entregados: la ganancia real es 0.");
        return (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Ganancia real</p>
            <p className="text-[11px] text-muted-foreground mb-2">Suma de la columna ganancia solo donde el estado es entregado.</p>
            <BreakRow label="Entregados" value={String(entN)} />
            <BreakRow label="Suma de ganancias" value={formatMoney(metrics.gananciaReal)} />
          </div>
        );
      }
      case "ganancia_estimada": {
        if (nonCN === 0) return warn("No hay pedidos no cancelados.");
        return (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Ganancia estimada</p>
            <p className="text-[11px] text-muted-foreground mb-2">Suma de ganancia en tránsito, novedad, devolución, pendiente y entregado — no cancelados.</p>
            <BreakRow label="Pedidos incluidos" value={String(nonCN)} />
            <BreakRow label="Suma de ganancias" value={formatMoney(metrics.gananciaEstimada)} />
          </div>
        );
      }
      case "inversion_meta": {
        return (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Inversión Meta</p>
            <p className="text-[11px] text-muted-foreground mb-2">No sale del Excel: lo ingresas arriba y lo guardamos por rango de fechas.</p>
            <BreakRow label="Monto considerado" value={formatMoney(inv)} hint="Usado como denominador en ROAS y como dividendo en CPA" />
            <BreakRow label="Entregados en el corte (referencia)" value={String(entN)} hint="Base de pedidos para CPA = inversión ÷ entregados" />
          </div>
        );
      }
      case "top_region": {
        const top = metrics.topRegionEntregados;
        if (!top) return warn("No hay entregados en el filtro actual.");
        return (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Top región (entregados)</p>
            <BreakRow label="Región" value={top.label} />
            <BreakRow label="Entregados en esa región" value={String(top.count)} hint="Misma lógica que el mapa: departamento o ciudad del Excel" />
          </div>
        );
      }
      case "vista_producto": {
        return (
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">Vista por producto</p>
            <BreakRow
              label="Filtro de categoría"
              value={product === "all" ? "Todos" : (productFilterOptions.find((o) => o.value === product)?.label ?? product)}
            />
            <BreakRow label="Pedidos listados abajo" value={String(filteredForMetrics.length)} hint="Respetan también región y logística del panel" />
          </div>
        );
      }
      default:
        return null;
    }
  }, [panelOrdersModal, filteredForMetrics, metrics, product, productFilterOptions]);

  const panelModalListCaption = useMemo(() => {
    if (!panelOrdersModal) return "";
    const n = panelModalOrders.length;
    if (panelOrdersModal.source === "status") {
      if (n === 0) return "No hay guías en este estado con los filtros actuales.";
      return `Guías en “${STATUS_METRIC_MODAL_TITLE[panelOrdersModal.bucket]}” (${n}) · desplázate para ver el detalle`;
    }
    switch (panelOrdersModal.metric) {
      case "total_vendido":
        return `Cada pedido suma su venta al total (${n} no cancelado(s))`;
      case "ganancia_real":
        return `Entregados que componen la ganancia real (${n})`;
      case "ganancia_estimada":
        return `No cancelados: suma de sus ganancias (${n})`;
      case "ganancia_promedio":
        return `Mismo conjunto que la ganancia real: entregados (${n})`;
      case "inversion_meta":
        return `Referencia operativa: entregados del corte (${n}) — útiles para contextualizar el CPA`;
      case "roas_ventas":
        return `Pedidos no cancelados: sus ventas suman el numerador del ROAS (${n})`;
      case "roas_real":
        return `Entregados: sus ganancias suman el numerador del ROAS real (${n})`;
      case "cpa":
        return `Entregados usados como divisor del CPA (${n})`;
      case "aov":
        return `Pedidos no cancelados del denominador del ticket promedio (${n})`;
      case "pct_ganancia_real":
        return `Entregados con venta y ganancia en el Excel (${n})`;
      case "pct_ganancia_estimada":
        return `No cancelados incluidos en el % (${n})`;
      case "top_region":
        return n === 0 ? "Sin entregados en la región líder con el filtro actual." : `Entregados solo en la región líder (${n})`;
      case "vista_producto":
        return `Pedidos que aplican al filtro actual de categoría (${n})`;
      default:
        return n === 0 ? "Sin pedidos." : `Pedidos relacionados (${n})`;
    }
  }, [panelOrdersModal, panelModalOrders.length]);

  const openStatusOrdersModal = useCallback((bucket: OrderStatusBucket) => {
    resetStatusFilterOnModalCloseRef.current = true;
    setStatusBucket(bucket);
    setPanelOrdersModal({ source: "status", bucket });
  }, []);

  const openMetricOrdersModal = useCallback((metric: FinancialMetricKey) => {
    resetStatusFilterOnModalCloseRef.current = false;
    setPanelOrdersModal({ source: "metric", metric });
  }, []);

  const closePanelOrdersModal = useCallback(() => {
    if (resetStatusFilterOnModalCloseRef.current) setStatusBucket("all");
    resetStatusFilterOnModalCloseRef.current = false;
    setPanelOrdersModal(null);
  }, []);

  const renderOrderCard = useCallback(
    (o: DropiOrderRow) => {
      const sale = o.product_sale_amount ?? 0;
      const profit = o.profit ?? 0;
      const ship = o.shipping_price ?? 0;
      const cpaGeneral = metrics.cpa ?? 0;
      const appliesCpa = o.status_bucket === "delivered";
      const gananciaAprox = appliesCpa && metrics.cpa != null ? profit - cpaGeneral : profit;
      const margenPct = sale > 0 ? Math.round((gananciaAprox / sale) * 1000) / 10 : 0;
      return (
        <Card>
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
              <div
                className={`rounded-lg border p-2 ${gananciaAprox >= 0 ? "border-primary/25 bg-primary/8" : "border-destructive/25 bg-destructive/8"}`}
              >
                <div
                  className={`text-[10px] uppercase tracking-wide mb-0.5 ${gananciaAprox >= 0 ? "text-primary/70" : "text-destructive/70"}`}
                >
                  Ganancia aprox.
                </div>
                <div className={`font-bold tabular-nums ${gananciaAprox >= 0 ? "text-primary" : "text-destructive"}`}>
                  {formatMoney(gananciaAprox)}
                </div>
              </div>
              <div className="rounded-lg border border-border/40 bg-muted/30 p-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">Envío</div>
                <div className="text-foreground font-bold tabular-nums">{formatMoney(ship)}</div>
              </div>
              <div
                className={`rounded-lg border p-2 ${margenPct >= 0 ? "border-info/25 bg-info/8" : "border-destructive/25 bg-destructive/8"}`}
              >
                <div
                  className={`text-[10px] uppercase tracking-wide mb-0.5 ${margenPct >= 0 ? "text-info/70" : "text-destructive/70"}`}
                >
                  Margen
                </div>
                <div className={`font-bold tabular-nums ${margenPct >= 0 ? "text-info" : "text-destructive"}`}>
                  {sale > 0 ? `${margenPct}%` : "—"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    },
    [metrics],
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

  const importDropiFile = useCallback(async (file: File) => {
    if (!userId) return;
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
          onConflict: "user_id,import_id,dropi_numeric_id",
        });
        if (upErr) throw upErr;
      }

      // El nuevo import pasa a ser el activo: el panel lo carga automáticamente.
      writeDropiActiveImportId(userId, imp.id);
      setActiveImportId(imp.id);
      // Si el modal de historial está abierto, refresca la lista en background.
      setImportHistory((prev) => [
        { id: imp.id, source_filename: file.name, row_count: parsed.length, created_at: new Date().toISOString() },
        ...prev,
      ]);

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
  }, [userId]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await importDropiFile(file);
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
      setImportCardCollapsed(true);
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

  const loadImportHistory = useCallback(async () => {
    if (!userId) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("dropi_order_imports")
        .select("id,source_filename,row_count,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setImportHistory(data ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar el historial");
      setImportHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [userId]);

  const openHistory = () => {
    setHistoryOpen(true);
    void loadImportHistory();
  };

  const signalDashboardResync = () => {
    try { localStorage.setItem("dropi:lastImportAt", String(Date.now())); } catch { /* noop */ }
  };

  const selectImport = (importId: string) => {
    if (!userId) return;
    writeDropiActiveImportId(userId, importId);
    setActiveImportId(importId);
    setHistoryOpen(false);
    setImportCardCollapsed(true);
    signalDashboardResync();
    toast.success("Subida cargada");
  };

  const clearActiveImport = () => {
    if (!userId) return;
    clearDropiActiveImportId(userId);
    setActiveImportId(null);
    setOrders([]);
    signalDashboardResync();
    toast.success("Panel reiniciado: sube una nueva guía o cargá una del historial");
  };

  const executeDeleteImport = async () => {
    if (!userId || !importPendingDelete) return;
    const importId = importPendingDelete.id;
    setDeleteImportBusy(true);
    try {
      const { error } = await supabase
        .from("dropi_order_imports")
        .delete()
        .eq("user_id", userId)
        .eq("id", importId);
      if (error) throw error;
      setImportHistory((prev) => prev.filter((i) => i.id !== importId));
      if (activeImportId === importId) {
        clearDropiActiveImportId(userId);
        setActiveImportId(null);
        setOrders([]);
        signalDashboardResync();
      }
      setImportPendingDelete(null);
      toast.success("Subida eliminada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo borrar");
    } finally {
      setDeleteImportBusy(false);
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
  const shippingTotal = useMemo(() => {
    // Coste de envíos "general": suma PRECIO FLETE de pedidos no cancelados del slice actual.
    return filteredForMetrics
      .filter((o) => o.status_bucket !== "cancelled")
      .reduce((s, o) => s + (o.shipping_price ?? 0), 0);
  }, [filteredForMetrics]);

  /* ── chart theme ── */
  const chartTheme = {
    grid: "hsl(var(--border))",
    tick: "hsl(var(--muted-foreground))",
    tooltip: {
      contentStyle: {
        backgroundColor: "rgba(17, 17, 22, 0.96)",
        border: "1px solid rgba(255, 255, 255, 0.14)",
        borderRadius: "8px",
        color: "#fff",
      },
      labelStyle: { color: "#fff", fontWeight: 500 },
      itemStyle: { color: "#fff" },
    },
    success: "hsl(var(--success))",
    primary: "hsl(var(--primary))",
    muted: "hsl(var(--muted-foreground))",
  };

  const dimensionFilterActive =
    (region !== "all" ? 1 : 0) + (product !== "all" ? 1 : 0) + (carrier !== "all" ? 1 : 0) + (statusBucket !== "all" ? 1 : 0);

  const statusLabel = useMemo(() => {
    if (statusBucket === "all") return null;
    const label = BUCKET_LABEL[statusBucket];
    return label ?? statusBucket;
  }, [statusBucket]);

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
      {!activeImportId && !importing && (
        <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/[0.04] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="size-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">No tienes una guía cargada en el panel</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sube un Excel de Dropi para empezar, o abre el historial para volver a cargar una subida anterior.
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={openHistory}>
              <History className="size-4" />
              Ver historial
            </Button>
          </div>
        </div>
      )}
      {/* ── Importar ── */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Upload className="size-4" strokeWidth={2} />
            Importar guías de pedidos
          </CardTitle>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={openHistory}
              aria-label="Ver historial de subidas"
              title="Historial de subidas"
            >
              <History className="size-4" />
              Historial
            </Button>
            {activeImportId && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={clearActiveImport}
                title="Vaciar el panel para subir otra guía"
              >
                Reiniciar
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setImportCardCollapsed((c) => !c)}
            >
              {importCardCollapsed ? "Mostrar importación" : "Ocultar"}
              <ChevronDown className={`size-4 transition-transform ${importCardCollapsed ? "" : "rotate-180"}`} />
            </Button>
          </div>
        </CardHeader>
        {importCardCollapsed ? (
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Rango activo <span className="font-medium text-foreground/90 tabular-nums">{dateFrom}</span> →{" "}
              <span className="font-medium text-foreground/90 tabular-nums">{dateTo}</span>. Tus pedidos y filtros se
              mantienen al cambiar de página mientras la sesión del navegador siga abierta.
            </p>
          </CardContent>
        ) : (
          <CardContent
            className="relative flex flex-wrap gap-4 items-end"
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (importing) return;
              setDragOverImport(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (importing) return;
              setDragOverImport(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOverImport(false);
            }}
            onDrop={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOverImport(false);
              if (importing) return;
              const f = e.dataTransfer?.files?.[0];
              if (!f) return;
              await importDropiFile(f);
            }}
            aria-label="Área de importación (puedes arrastrar un archivo aquí)"
          >
            {dragOverImport && !importing && (
              <div className="absolute inset-0 z-10 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/[0.06] backdrop-blur-sm">
                <div className="flex h-full items-center justify-center p-6">
                  <div className="rounded-2xl border border-primary/25 bg-background/60 px-5 py-4 text-center shadow-elev-2">
                    <p className="text-sm font-semibold text-foreground">Suelta el archivo aquí</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Importaremos tus guías automáticamente (Excel de Dropi).
                    </p>
                  </div>
                </div>
              </div>
            )}
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
              <p className="mt-1 text-[11px] text-muted-foreground">
                También puedes <span className="font-medium text-foreground/80">arrastrar y soltar</span> el archivo aquí.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadOrders()} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Recargar
            </Button>
          </CardContent>
        )}
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
        <MetricCard
          title="Total vendido"
          value={formatMoney(metrics.totalVendido)}
          icon={DollarSign}
          color="primary"
          description="Suma valor compra productos, excl. cancelados / anulados"
          loading={loading}
          onClick={() => openMetricOrdersModal("total_vendido")}
          titleAttr="Ver pedidos que suman esta métrica"
        />
        <MetricCard
          title="Ganancia real"
          value={formatMoney(metrics.gananciaReal)}
          icon={TrendingUp}
          color="success"
          description="Suma GANANCIA solo pedidos entregados"
          loading={loading}
          onClick={() => openMetricOrdersModal("ganancia_real")}
          titleAttr="Ver entregados y detalle"
        />
        <MetricCard
          title="Ganancia estimada"
          value={formatMoney(metrics.gananciaEstimada)}
          icon={TrendingUp}
          color="warning"
          description="Suma GANANCIA en todos los no cancelados"
          loading={loading}
          onClick={() => openMetricOrdersModal("ganancia_estimada")}
          titleAttr="Ver pedidos no cancelados"
        />
        <MetricCard
          title="Ganancia promedio"
          value={formatMoney(metrics.gananciaPromedioEntregado)}
          icon={Target}
          color="primary"
          description="Por pedido entregado"
          loading={loading}
          onClick={() => openMetricOrdersModal("ganancia_promedio")}
          titleAttr="Ver entregados (base del promedio)"
        />
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/95 p-5 shadow-elev-1 backdrop-blur-sm transition-all duration-base ease-standard">
          <div className="flex items-start justify-between gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
              <Package className="size-[18px]" strokeWidth={2} />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 text-xs text-muted-foreground hover:text-foreground"
              disabled={loading}
              onClick={() => openMetricOrdersModal("vista_producto")}
            >
              Ver pedidos
            </Button>
          </div>
          <div className="mt-5 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vista por producto</p>
            <Select
              value={product}
              onValueChange={(v) => {
                setProduct(v);
                setDeliveryLagCategoryKeys([]);
              }}
              disabled={loading || productFilterOptions.length <= 1}
            >
              <SelectTrigger className="h-10 w-full border-border/60 bg-background/80 text-left text-foreground">
                <SelectValue placeholder="Todos los productos" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-[min(60vh,320px)]">
                {productFilterOptions.map((opt) => (
                  <SelectItem key={opt.value === "all" ? "__all__" : opt.label} value={opt.value}>
                    {opt.value === "all" ? opt.label : `${opt.label} (${opt.count})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Categorías leídas del Excel (columna CATEGORÍAS). Respeta región y logística si las tienes filtradas.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Inversión Meta"
          value={formatMoney(metrics.inversionMeta)}
          icon={Megaphone}
          color="warning"
          description="Gasto en ads (manual)"
          loading={loading}
          onClick={() => openMetricOrdersModal("inversion_meta")}
          titleAttr="Ver contexto y pedidos entregados (base CPA)"
        />
        <MetricCard
          title="ROAS ventas"
          value={formatRoas(metrics.roasVentas)}
          icon={DollarSign}
          color="info"
          description="Total vendido / ads"
          loading={loading}
          onClick={() => openMetricOrdersModal("roas_ventas")}
          titleAttr="Ver pedidos que entran en total vendido"
        />
        <MetricCard
          title="ROAS real"
          value={formatRoas(metrics.roasReal)}
          icon={TrendingUp}
          color="success"
          description="Ganancia real / ads"
          loading={loading}
          onClick={() => openMetricOrdersModal("roas_real")}
          titleAttr="Ver entregados (base ganancia real)"
        />
        <MetricCard
          title="CPA"
          value={metrics.cpa != null ? formatMoney(metrics.cpa) : "—"}
          icon={Target}
          color="primary"
          description="Ads / pedidos entregados"
          loading={loading}
          onClick={() => openMetricOrdersModal("cpa")}
          titleAttr="Ver pedidos entregados del cálculo"
        />
        <MetricCard
          title="AOV"
          value={formatMoney(metrics.aov)}
          icon={Package}
          color="primary"
          description="Ticket promedio (total vendido / no cancelados)"
          loading={loading}
          onClick={() => openMetricOrdersModal("aov")}
          titleAttr="Ver pedidos no cancelados"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <MetricCard
          title="Total pedidos"
          value="100%"
          icon={Package}
          description={
            statusBucket === "all"
              ? `${metrics.totalPedidos} pedidos · Clic para ver el detalle`
              : `${metrics.totalPedidos} pedidos · Clic: ver todos en ventana emergente`
          }
          loading={loading}
          onClick={() => openStatusOrdersModal("all")}
          active={statusBucket === "all"}
          aria-pressed={statusBucket === "all"}
          titleAttr="Ver todos los pedidos y guías (ventana emergente)"
        />
        <MetricCard
          title="Confirmados *"
          value={`${c.confirmados} (${pct(c.confirmados)})`}
          icon={BarChart3}
          color="info"
          description={statusBucket === "in_transit" ? "Filtrando guías en la lista" : "En tránsito / reparto"}
          loading={loading}
          onClick={() => openStatusOrdersModal("in_transit")}
          active={statusBucket === "in_transit"}
          aria-pressed={statusBucket === "in_transit"}
          titleAttr="Filtrar lista: pedidos confirmados / en tránsito"
        />
        <MetricCard
          title="Entregados"
          value={`${c.entregados} (${pct(c.entregados)})`}
          icon={TrendingUp}
          color="success"
          description={statusBucket === "delivered" ? "Filtrando guías en la lista" : undefined}
          loading={loading}
          onClick={() => openStatusOrdersModal("delivered")}
          active={statusBucket === "delivered"}
          aria-pressed={statusBucket === "delivered"}
          titleAttr="Filtrar lista: entregados"
        />
        <MetricCard
          title="Pendientes"
          value={`${c.pendientes} (${pct(c.pendientes)})`}
          icon={Target}
          description={statusBucket === "pending" ? "Filtrando guías en la lista" : undefined}
          loading={loading}
          onClick={() => openStatusOrdersModal("pending")}
          active={statusBucket === "pending"}
          aria-pressed={statusBucket === "pending"}
          titleAttr="Filtrar lista: pendientes"
        />
        <MetricCard
          title="Novedades"
          value={`${c.novedades} (${pct(c.novedades)})`}
          icon={BarChart3}
          color="warning"
          description={statusBucket === "issue" ? "Filtrando guías en la lista" : undefined}
          loading={loading}
          onClick={() => openStatusOrdersModal("issue")}
          active={statusBucket === "issue"}
          aria-pressed={statusBucket === "issue"}
          titleAttr="Filtrar lista: novedades"
        />
        <MetricCard
          title="En devolución"
          value={`${c.enDevolucion} (${pct(c.enDevolucion)})`}
          icon={Package}
          color="destructive"
          description={statusBucket === "return_flow" ? "Filtrando guías en la lista" : undefined}
          loading={loading}
          onClick={() => openStatusOrdersModal("return_flow")}
          active={statusBucket === "return_flow"}
          aria-pressed={statusBucket === "return_flow"}
          titleAttr="Filtrar lista: en devolución"
        />
        <MetricCard
          title="Cancelados"
          value={`${c.cancelados} (${pct(c.cancelados)})`}
          icon={Package}
          color="destructive"
          description={statusBucket === "cancelled" ? "Filtrando guías en la lista" : undefined}
          loading={loading}
          onClick={() => openStatusOrdersModal("cancelled")}
          active={statusBucket === "cancelled"}
          aria-pressed={statusBucket === "cancelled"}
          titleAttr="Filtrar lista: cancelados"
        />
      </div>

      <Dialog open={panelOrdersModal !== null} onOpenChange={(open) => { if (!open) closePanelOrdersModal(); }}>
        <DialogContent className="flex max-h-[min(90vh,900px)] min-h-0 flex-col gap-4 overflow-hidden p-6 sm:max-w-2xl">
          <DialogHeader className="shrink-0 space-y-2 text-left">
            <DialogTitle>{panelModalTitle}</DialogTitle>
            {panelOrdersModal?.source === "status" ? (
              <DialogDescription className="text-left text-sm text-muted-foreground">
                {panelModalOrders.length === 0
                  ? "No hay guías en este estado con los filtros actuales."
                  : "Mismo rango de fechas y filtros de región, producto y logística. Desplázate para ver cada guía."}
              </DialogDescription>
            ) : (
              <DialogDescription className="sr-only">
                Desglose de la métrica y listado de pedidos relacionados.
              </DialogDescription>
            )}
          </DialogHeader>
          {panelModalBreakdown}
          <div className="shrink-0 space-y-1 border-b border-border/40 pb-2">
            <p className="text-sm font-medium text-foreground leading-snug">{panelModalListCaption}</p>
            <p className="text-[11px] text-muted-foreground">Rango de fechas del panel y filtros activos aplican a todos los números.</p>
          </div>
          <div
            className="min-h-0 max-h-[min(calc(90vh-12rem),720px)] flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pr-1 [-webkit-overflow-scrolling:touch] scroll-smooth"
            role="region"
            aria-label="Listado de pedidos"
            tabIndex={0}
          >
            <div className="space-y-3 pb-1">
              {panelModalOrders.map((o) => (
                <Fragment key={o.id}>{renderOrderCard(o)}</Fragment>
              ))}
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-border/40 pt-4 mt-0 sm:justify-end">
            <Button type="button" variant="secondary" onClick={closePanelOrdersModal}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="% Ganancia real"
          value={`${metrics.pctGananciaReal}%`}
          icon={Percent}
          color="success"
          description="Ganancia bruta sobre ventas de pedidos entregados"
          loading={loading}
          onClick={() => openMetricOrdersModal("pct_ganancia_real")}
          titleAttr="Ver entregados"
        />
        <MetricCard
          title="% Ganancia estimada"
          value={`${metrics.pctGananciaEstimada}%`}
          icon={Percent}
          color="warning"
          description="Ganancia bruta sobre ventas de pedidos no cancelados"
          loading={loading}
          onClick={() => openMetricOrdersModal("pct_ganancia_estimada")}
          titleAttr="Ver no cancelados"
        />
        <MetricCard
          title="Top región entregados"
          value={metrics.topRegionEntregados?.label ?? "—"}
          icon={MapPin}
          color="info"
          description={metrics.topRegionEntregados ? `${metrics.topRegionEntregados.count} entregados` : "Sin entregados en el filtro"}
          loading={loading}
          onClick={() => openMetricOrdersModal("top_region")}
          titleAttr="Ver entregados de la región líder"
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

      {/* ── Pedidos por región (apilado o por estado) ── */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>{regionChartTitle}</CardTitle>
            {regionChartBucket === "all" ? (
              <CardDescription>
                Vista <span className="font-medium text-foreground/90">Todos</span>: cada barra apila{" "}
                <span className="whitespace-nowrap">entregas</span>,{" "}
                <span className="whitespace-nowrap">en tránsito</span>,{" "}
                <span className="whitespace-nowrap">devoluciones</span> y{" "}
                <span className="whitespace-nowrap">cancelados</span> por región. Elige un recuadro debajo para ver solo
                ese estado.
              </CardDescription>
            ) : (
              <CardDescription>
                Mostrando solo pedidos en estado seleccionado; orden por cantidad por región. Clic en una barra para KPIs
                de la región.
              </CardDescription>
            )}
          </div>
          {vizRegion && (
            <Button size="sm" variant="ghost" className="text-muted-foreground shrink-0" onClick={() => setVizRegion(null)}>
              Quitar selección
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-0">
          {ordersChartProductOnly.length === 0 ? (
            <p className="text-sm text-muted-foreground pb-4">Sin datos para el periodo del gráfico y filtros de producto/logística.</p>
          ) : regionChartBucket === "all" && regionBarsStacked.length === 0 ? (
            <p className="text-sm text-muted-foreground pb-4">Sin pedidos agrupables por región en este periodo.</p>
          ) : regionChartBucket !== "all" && regionBars.length === 0 ? (
            <p className="text-sm text-muted-foreground pb-4">No hay pedidos con este estado en el periodo del gráfico.</p>
          ) : (
            <>
              <div
                className={[
                  "w-full rounded-xl border border-border/50 bg-muted/15 px-1 pt-2",
                  regionChartBucket === "all" ? "h-[300px]" : "h-[280px]",
                ].join(" ")}
              >
                <ResponsiveContainer width="100%" height="100%">
                  {regionChartBucket === "all" ? (
                    <BarChart
                      data={regionBarsStacked}
                      margin={{ top: 10, right: 12, left: 4, bottom: 6 }}
                      barCategoryGap="14%"
                      onClick={(s) => {
                        const p = s?.activePayload?.[0]?.payload as { region?: string } | undefined;
                        const r = p?.region;
                        if (r) setVizRegion((prev) => (prev === r ? null : r));
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={chartTheme.grid}
                        strokeOpacity={0.45}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="region"
                        tick={{ fill: chartTheme.tick, fontSize: 9 }}
                        tickFormatter={(v) => String(v).toUpperCase()}
                        interval={0}
                        angle={-32}
                        textAnchor="end"
                        height={88}
                        tickLine={{ stroke: chartTheme.grid }}
                      />
                      <YAxis tick={{ fill: chartTheme.tick, fontSize: 11 }} allowDecimals={false} width={36} tickLine={false} />
                      <Tooltip cursor={{ fill: "hsl(var(--accent)/0.22)" }} {...chartTheme.tooltip} />
                      <Bar
                        dataKey="delivered"
                        name="Entregas"
                        stackId="a"
                        fill={regionStatusChartColors.delivered}
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="in_transit"
                        name="En tránsito"
                        stackId="a"
                        fill={regionStatusChartColors.in_transit}
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="return_flow"
                        name="Devoluciones"
                        stackId="a"
                        fill={regionStatusChartColors.return_flow}
                        radius={[0, 0, 0, 0]}
                      />
                      {regionStackShowsOther ? (
                        <>
                          <Bar
                            dataKey="cancelled"
                            name="Cancelados"
                            stackId="a"
                            fill={regionStatusChartColors.cancelled}
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar
                            dataKey="other"
                            name="Otros estados"
                            stackId="a"
                            fill={regionStatusChartColors.other}
                            radius={[10, 10, 0, 0]}
                          />
                        </>
                      ) : (
                        <Bar
                          dataKey="cancelled"
                          name="Cancelados"
                          stackId="a"
                          fill={regionStatusChartColors.cancelled}
                          radius={[10, 10, 0, 0]}
                        />
                      )}
                    </BarChart>
                  ) : (
                    <BarChart
                      data={regionBars}
                      margin={{ top: 10, right: 12, left: 4, bottom: 6 }}
                      barCategoryGap="14%"
                      onClick={(s) => {
                        const p = s?.activePayload?.[0]?.payload as { region?: string } | undefined;
                        const r = p?.region;
                        if (r) setVizRegion((prev) => (prev === r ? null : r));
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={chartTheme.grid}
                        strokeOpacity={0.45}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="region"
                        tick={{ fill: chartTheme.tick, fontSize: 9 }}
                        tickFormatter={(v) => String(v).toUpperCase()}
                        interval={0}
                        angle={-32}
                        textAnchor="end"
                        height={88}
                        tickLine={{ stroke: chartTheme.grid }}
                      />
                      <YAxis tick={{ fill: chartTheme.tick, fontSize: 11 }} allowDecimals={false} width={36} tickLine={false} />
                      <Tooltip cursor={{ fill: "hsl(var(--accent)/0.22)" }} {...chartTheme.tooltip} />
                      <Bar dataKey="count" name="Pedidos" radius={[8, 8, 0, 0]} maxBarSize={52}>
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
                  )}
                </ResponsiveContainer>
              </div>

              {/* Recuadros bajo el gráfico: filtro por estado (zona tipo leyenda / referencia) */}
              <div className="mt-3 border-t border-border/70 pt-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-2">
                  Ver por estado
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {(
                    [
                      {
                        key: "all" as const,
                        label: "Todos",
                        sub: "Apilado",
                        count: regionBucketCounts.all,
                        strip: `linear-gradient(180deg, ${regionStatusChartColors.delivered} 0%, ${regionStatusChartColors.in_transit} 33%, ${regionStatusChartColors.return_flow} 66%, ${regionStatusChartColors.cancelled} 100%)`,
                      },
                      {
                        key: "delivered" as const,
                        label: "Entregas",
                        sub: "Solo entregados",
                        count: regionBucketCounts.delivered,
                        strip: regionStatusChartColors.delivered,
                      },
                      {
                        key: "return_flow" as const,
                        label: "Devoluciones",
                        sub: "En devolución",
                        count: regionBucketCounts.return_flow,
                        strip: regionStatusChartColors.return_flow,
                      },
                      {
                        key: "in_transit" as const,
                        label: "En tránsito",
                        sub: "En ruta",
                        count: regionBucketCounts.in_transit,
                        strip: regionStatusChartColors.in_transit,
                      },
                      {
                        key: "cancelled" as const,
                        label: "Cancelados",
                        sub: "Anulados",
                        count: regionBucketCounts.cancelled,
                        strip: regionStatusChartColors.cancelled,
                      },
                    ] as const
                  ).map((b) => {
                    const active = regionChartBucket === b.key;
                    return (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => setRegionChartBucket(b.key)}
                        className={[
                          "relative overflow-hidden rounded-xl border pl-3.5 pr-2.5 py-2.5 text-left transition-all duration-base ease-standard",
                          active
                            ? "border-primary/45 bg-primary/[0.07] shadow-glow ring-1 ring-primary/25"
                            : "border-border/60 bg-card/90 hover:border-border hover:shadow-elev-1",
                        ].join(" ")}
                        aria-pressed={active}
                      >
                        <span
                          aria-hidden
                          className="absolute left-0 top-0 bottom-0 w-1"
                          style={
                            b.key === "all"
                              ? { background: b.strip }
                              : { backgroundColor: b.strip as string }
                          }
                        />
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{b.label}</div>
                        <div className="mt-0.5 text-lg font-bold text-foreground tabular-nums leading-tight">{b.count}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{b.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
                Periodo del gráfico: {chartBounds.chartFrom} → {chartBounds.chartTo}. Respeta categoría de producto y
                logística. Clic en una barra para KPIs de la región. El gasto en anuncios se reparte proporcionalmente al
                volumen de pedidos.
              </p>
            </>
          )}

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

      {/* ── Días promedio de entrega por región ── */}
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Días promedio de entrega por región</CardTitle>
              <CardDescription>
                Promedio de días entre la fecha del pedido y la fecha de reporte, solo guías{" "}
                <span className="font-medium text-foreground/90">entregadas</span>. Periodo del gráfico:{" "}
                {chartBounds.chartFrom} → {chartBounds.chartTo}.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Popover open={deliveryLagFilterOpen} onOpenChange={setDeliveryLagFilterOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="gap-1.5">
                    <Filter className="size-3.5" strokeWidth={2} />
                    Categorías (este gráfico)
                    {deliveryLagCategoryKeys.length > 0 ? (
                      <Badge variant="soft" className="ml-0.5 tabular-nums">
                        {deliveryLagCategoryKeys.length}
                      </Badge>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[min(100vw-2rem,360px)] p-0" align="end">
                  <Command className="rounded-lg border-0">
                    <CommandInput placeholder="Buscar categoría…" />
                    <CommandList className="max-h-[min(50vh,280px)]">
                      <CommandEmpty>Sin categorías en este periodo.</CommandEmpty>
                      <CommandGroup heading="Incluir en el gráfico (puedes elegir varias)">
                        {deliveryLagCategoryOptions.map((opt) => {
                          const selected = deliveryLagCategoryKeys.includes(opt.value);
                          return (
                            <CommandItem
                              key={opt.value}
                              value={opt.label}
                              onSelect={() => {
                                setDeliveryLagCategoryKeys((prev) =>
                                  prev.includes(opt.value) ? prev.filter((k) => k !== opt.value) : [...prev, opt.value],
                                );
                              }}
                            >
                              <Check className={`mr-2 size-4 shrink-0 ${selected ? "opacity-100" : "opacity-0"}`} />
                              <span className="truncate">
                                {opt.label} <span className="text-muted-foreground tabular-nums">({opt.count})</span>
                              </span>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                  <div className="border-t border-border p-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={() => {
                        setDeliveryLagCategoryKeys([]);
                        setDeliveryLagFilterOpen(false);
                      }}
                    >
                      Volver al filtro general de producto
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <div className="min-w-[200px]">
                <label className="sr-only">Categoría (mismo filtro que arriba)</label>
                <Select
                  value={product}
                  onValueChange={(v) => {
                    setProduct(v);
                    setDeliveryLagCategoryKeys([]);
                  }}
                  disabled={loading || productFilterOptions.length <= 1}
                >
                  <SelectTrigger className="h-9 border-border/60 bg-background/80 text-xs">
                    <SelectValue placeholder="Producto (panel)" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[min(60vh,320px)]">
                    {productFilterOptions.map((opt) => (
                      <SelectItem key={opt.value === "all" ? "__all__" : opt.label} value={opt.value}>
                        {opt.value === "all" ? opt.label : `${opt.label} (${opt.count})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {deliveryLagCategoryKeys.length > 0 ? (
              <>
                <span className="font-medium text-foreground/85">Solo categorías elegidas:</span>{" "}
                {deliveryLagCategoryKeys.join(", ")}.
              </>
            ) : (
              <>
                Usando la categoría del filtro general
                {product !== "all" ? (
                  <>
                    :{" "}
                    <span className="font-medium text-foreground/85">
                      {productFilterOptions.find((o) => o.value === product)?.label ?? product}
                    </span>
                  </>
                ) : (
                  <> (todas las categorías del periodo).</>
                )}
              </>
            )}{" "}
            Logística: {carrier === "all" ? "todas" : carrier}.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {deliveryDaysByRegion.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin entregas con fechas válidas (pedido y reporte) para armar el promedio con los filtros actuales.
            </p>
          ) : (
            <div className="h-[320px] w-full rounded-xl border border-border/40 bg-muted/20 px-1 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deliveryDaysByRegion}
                  margin={{ top: 12, right: 12, left: 4, bottom: 8 }}
                  barCategoryGap="12%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={chartTheme.grid}
                    strokeOpacity={0.45}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="region"
                    tick={{ fill: chartTheme.tick, fontSize: 10 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={96}
                    tickLine={{ stroke: chartTheme.grid }}
                  />
                  <YAxis
                    tick={{ fill: chartTheme.tick, fontSize: 11 }}
                    tickFormatter={(v) => `${v} d`}
                    domain={[0, deliveryLagYAxisMax]}
                    ticks={deliveryLagYTicks}
                    allowDecimals
                    width={40}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--accent)/0.25)" }}
                    {...chartTheme.tooltip}
                    formatter={(value: number, name: string, payload: { payload?: { deliveredCount?: number } }) => {
                      if (name === "avgDays") {
                        const n = payload?.payload?.deliveredCount ?? 0;
                        return [`${value} días · ${n} entregas`, "Promedio"];
                      }
                      return [String(value), name];
                    }}
                  />
                  <Bar dataKey="avgDays" name="avgDays" radius={[10, 10, 0, 0]} maxBarSize={56}>
                    {deliveryDaysByRegion.map((entry) => (
                      <Cell key={entry.region} fill={regionChartColor(entry.region)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-xs text-muted-foreground leading-relaxed">
            Cálculo: <span className="font-medium text-foreground/80">FECHA DE REPORTE</span> −{" "}
            <span className="font-medium text-foreground/80">FECHA</span> del archivo importado. Orden: mayor demora a la
            izquierda. Para comparar varias líneas de producto a la vez, usa &quot;Categorías (este gráfico)&quot;.
          </p>
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
                            description="Prom. entregados: precio venta − flete − costo proveedor (Excel)"
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
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      label: "CPA general",
                      value: metrics.cpa != null ? formatMoney(metrics.cpa) : "—",
                      hint: "Ads / entregados",
                    },
                    {
                      label: "Envíos (total)",
                      value: formatMoney(shippingTotal),
                      hint: "Suma PRECIO FLETE",
                    },
                    {
                      label: "Ganancia (real)",
                      value: formatMoney(metrics.gananciaReal),
                      hint: "Solo entregados",
                    },
                    {
                      label: "Ticket promedio",
                      value: formatMoney(metrics.aov),
                      hint: "AOV",
                    },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="min-h-[5.5rem] rounded-xl border border-border/50 bg-muted/20 px-4 py-3 shadow-inner shadow-black/[0.03] sm:min-h-[6rem] sm:px-5 sm:py-4"
                    >
                      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                        {m.label}
                      </div>
                      <div className="mt-1 text-lg font-semibold tabular-nums text-foreground sm:mt-1.5 sm:text-xl md:text-2xl">
                        {m.value}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground line-clamp-2 sm:text-xs">
                        {m.hint}
                      </div>
                    </div>
                  ))}
                </div>
                {metrics.cpa == null && (
                  <p className="text-[11px] text-muted-foreground">
                    Para ver CPA, añade gasto en anuncios y asegúrate de tener pedidos entregados.
                  </p>
                )}
              </div>
              {statusLabel && (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="tabular-nums">
                    Estado: {statusLabel}
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-muted-foreground"
                    onClick={() => setStatusBucket("all")}
                  >
                    Quitar filtro
                  </Button>
                </div>
              )}
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
                                      setDeliveryLagCategoryKeys([]);
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
                        setDeliveryLagCategoryKeys([]);
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
                {ordersListFiltered.map((o) => (
                  <Fragment key={o.id}>{renderOrderCard(o)}</Fragment>
                ))}
              </div>
            </ScrollArea>
          )}
          <p className="text-[11px] text-muted-foreground mt-3">
            <span className="font-semibold text-foreground/80">CPA general</span> = inversión Meta del rango / pedidos entregados.{" "}
            <span className="font-semibold text-foreground/80">Ganancia aprox.</span> = ganancia del pedido
            {metrics.cpa != null ? " (solo entregados) − CPA general" : ""}.{" "}
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

      {/* ── Dialog historial de subidas ── */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="size-4" />
              Historial de subidas
            </DialogTitle>
            <DialogDescription>
              Hacé click en una subida para volver a cargar sus pedidos en el panel.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto -mx-1 px-1">
            {historyLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Cargando…</p>
            ) : importHistory.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Todavía no subiste ninguna guía.
              </p>
            ) : (
              <ul className="divide-y divide-border/40">
                {importHistory.map((imp) => {
                  const isActive = imp.id === activeImportId;
                  const date = new Date(imp.created_at);
                  const dateLabel = date.toLocaleString("es-CL", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <li key={imp.id} className="flex items-center gap-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => selectImport(imp.id)}
                        className={`flex-1 min-w-0 text-left rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60 ${
                          isActive ? "bg-primary/10 ring-1 ring-primary/30" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate text-sm font-medium text-foreground" title={imp.source_filename}>
                            {imp.source_filename}
                          </span>
                          {isActive && (
                            <Badge variant="soft" className="ml-1 shrink-0">Activo</Badge>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="tabular-nums">{dateLabel}</span>
                          <span>·</span>
                          <span className="tabular-nums">{imp.row_count} filas</span>
                        </div>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setImportPendingDelete(imp)}
                        title="Borrar esta subida"
                        aria-label="Borrar subida"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!importPendingDelete}
        onOpenChange={(open) => {
          if (!open && deleteImportBusy) return;
          if (!open) setImportPendingDelete(null);
        }}
      >
        <AlertDialogContent
          className="sm:max-w-[420px] gap-0 overflow-hidden border border-border/50 bg-card/95 p-0 shadow-2xl shadow-black/40 backdrop-blur-xl sm:rounded-2xl"
          onPointerDownOutside={(e) => deleteImportBusy && e.preventDefault()}
          onEscapeKeyDown={(e) => deleteImportBusy && e.preventDefault()}
        >
          <div className="relative px-6 pt-7 pb-2">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/25 via-rose-500/10 to-amber-500/10 ring-1 ring-rose-500/35 shadow-[0_0_32px_-8px_rgba(244,63,94,0.45)]">
              <Trash2 className="size-7 text-rose-300" strokeWidth={1.75} />
            </div>
            <AlertDialogHeader className="space-y-3 text-center sm:text-center">
              <AlertDialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                ¿Eliminar esta subida?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed text-center">
                Se borrará el registro de esta importación y los pedidos asociados en tu cuenta. Esta acción no se puede
                deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {importPendingDelete && (
              <div className="mt-5 rounded-xl border border-border/60 bg-muted/25 px-4 py-3.5 shadow-inner">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-background/80 ring-1 ring-border/50">
                    <FileSpreadsheet className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground" title={importPendingDelete.source_filename}>
                      {importPendingDelete.source_filename}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {new Date(importPendingDelete.created_at).toLocaleString("es-CL", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {importPendingDelete.row_count} filas
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
                  <AlertTriangle className="size-4 shrink-0 text-amber-400/90 mt-0.5" />
                  <span>Si esta subida está activa en el panel, el panel quedará vacío hasta que cargues otra guía.</span>
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter className="flex-col-reverse gap-2 border-t border-border/40 bg-muted/15 px-6 py-4 sm:flex-row sm:justify-end sm:gap-3">
            <AlertDialogCancel
              disabled={deleteImportBusy}
              className="mt-0 w-full border-border/60 bg-background/80 text-foreground hover:bg-muted/80 sm:w-auto"
            >
              Cancelar
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteImportBusy}
              className="w-full gap-2 bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-900/25 hover:from-rose-500 hover:to-rose-600 sm:w-auto"
              onClick={() => void executeDeleteImport()}
            >
              {deleteImportBusy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {deleteImportBusy ? "Eliminando…" : "Eliminar definitivamente"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
