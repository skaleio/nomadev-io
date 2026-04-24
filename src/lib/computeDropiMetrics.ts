import type { DropiStatusBucket } from "@/lib/dropiImport";

export type DropiOrderForMetrics = {
  status_bucket: DropiStatusBucket;
  order_date: string;
  department: string | null;
  city: string | null;
  categories: string | null;
  product_sale_amount: number | null;
  profit: number | null;
  invoiced_amount: number | null;
  invoice_number: string | null;
  supplier_total: number | null;
  shipping_price: number | null;
  commission: number | null;
  return_shipping_cost: number | null;
};

export type DropiMetricsFilters = {
  region: string;
  product: string;
};

const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);

function saleAmount(o: DropiOrderForMetrics): number {
  return o.product_sale_amount ?? 0;
}

function profitAmount(o: DropiOrderForMetrics): number {
  return o.profit ?? 0;
}

function isInvoiced(o: DropiOrderForMetrics): boolean {
  const inv = (o.invoice_number ?? "").trim();
  const amt = o.invoiced_amount ?? 0;
  return inv.length > 0 || amt > 0;
}

export function regionKey(o: DropiOrderForMetrics): string {
  const d = (o.department ?? "").trim();
  if (d) return d;
  const c = (o.city ?? "").trim();
  if (c) return c;
  return "Sin región";
}

function matchesRegion(o: DropiOrderForMetrics, region: string): boolean {
  if (region === "all") return true;
  return regionKey(o) === region;
}

function matchesProduct(o: DropiOrderForMetrics, product: string): boolean {
  if (product === "all") return true;
  const c = (o.categories ?? "").trim() || "Sin categoría";
  return c === product;
}

function variableCost(o: DropiOrderForMetrics): number {
  return (
    (o.supplier_total ?? 0) +
    (o.shipping_price ?? 0) +
    (o.commission ?? 0) +
    (o.return_shipping_cost ?? 0)
  );
}

export function filterDropiOrders(orders: DropiOrderForMetrics[], f: DropiMetricsFilters): DropiOrderForMetrics[] {
  return orders.filter((o) => matchesRegion(o, f.region) && matchesProduct(o, f.product));
}

export type DropiDashboardMetrics = {
  totalPedidos: number;
  totalVendido: number;
  facturacionConfirmados: number;
  gananciaReal: number;
  gananciaEstimada: number;
  gananciaPromedioEntregado: number;
  inversionMeta: number;
  roasFacturacion: number | null;
  roasReal: number | null;
  cpa: number | null;
  aov: number;
  pctGananciaReal: number;
  pctGananciaEstimada: number;
  counts: {
    confirmados: number;
    entregados: number;
    pendientes: number;
    novedades: number;
    enDevolucion: number;
    cancelados: number;
  };
  topRegionEntregados: { label: string; count: number } | null;
  topProducto: { label: string; pedidos: number } | null;
};

/**
 * Definiciones (alineadas al panel de rentabilidad COD):
 * - Total vendido: suma VALOR DE COMPRA EN PRODUCTOS excl. cancelados / rechazados / anulados.
 * - Confirmados operativos: pedidos en ruta (in_transit), no entregados ni cancelados.
 * - Facturación confirmados: suma VALOR FACTURADO solo si hay factura o monto facturado; si no hay datos, 0.
 * - Ganancia real: suma GANANCIA solo entregados.
 * - Ganancia estimada: suma GANANCIA en todos los no cancelados (incluye en tránsito / novedad / devolución).
 * - AOV: total vendido / pedidos que entran en total vendido.
 * - ROAS facturación: facturación confirmados / inversión Meta.
 * - ROAS real: ganancia real / inversión Meta.
 * - CPA: inversión Meta / pedidos entregados.
 */
export function computeDropiMetrics(
  orders: DropiOrderForMetrics[],
  metaAdSpend: number,
): DropiDashboardMetrics {
  const totalPedidos = orders.length;

  const cancelled = orders.filter((o) => o.status_bucket === "cancelled");
  const delivered = orders.filter((o) => o.status_bucket === "delivered");
  const issue = orders.filter((o) => o.status_bucket === "issue");
  const returnFlow = orders.filter((o) => o.status_bucket === "return_flow");
  const pending = orders.filter((o) => o.status_bucket === "pending");
  const inTransit = orders.filter((o) => o.status_bucket === "in_transit");

  const nonCancelled = orders.filter((o) => o.status_bucket !== "cancelled");

  const forTotalVendido = nonCancelled;
  const totalVendido = forTotalVendido.reduce((s, o) => s + saleAmount(o), 0);

  const confirmadosList = inTransit;
  const confirmados = confirmadosList.length;

  const facturacionConfirmados = orders
    .filter((o) => o.status_bucket !== "cancelled" && isInvoiced(o))
    .reduce((s, o) => {
      const inv = o.invoiced_amount ?? 0;
      return s + (inv > 0 ? inv : saleAmount(o));
    }, 0);

  const gananciaReal = delivered.reduce((s, o) => s + profitAmount(o), 0);
  const gananciaEstimada = nonCancelled.reduce((s, o) => s + profitAmount(o), 0);

  const entCount = delivered.length;
  const gananciaPromedioEntregado = entCount > 0 ? gananciaReal / entCount : 0;

  const vendidoDenominator = forTotalVendido.length;
  const aov = vendidoDenominator > 0 ? totalVendido / vendidoDenominator : 0;

  const ventasEntregado = delivered.reduce((s, o) => s + saleAmount(o), 0);
  const pctGananciaReal = pct(gananciaReal, ventasEntregado);
  const ventasNoCancel = nonCancelled.reduce((s, o) => s + saleAmount(o), 0);
  const pctGananciaEstimada = pct(gananciaEstimada, ventasNoCancel);

  const inversionMeta = metaAdSpend;
  const roasFacturacion = inversionMeta > 0 ? facturacionConfirmados / inversionMeta : null;
  const roasReal = inversionMeta > 0 ? gananciaReal / inversionMeta : null;
  const cpa = inversionMeta > 0 && entCount > 0 ? inversionMeta / entCount : null;

  const byDept = new Map<string, number>();
  for (const o of delivered) {
    const label = (o.department ?? o.city ?? "").trim() || "Sin región";
    byDept.set(label, (byDept.get(label) ?? 0) + 1);
  }
  let topRegionEntregados: { label: string; count: number } | null = null;
  for (const [label, count] of byDept) {
    if (!topRegionEntregados || count > topRegionEntregados.count) topRegionEntregados = { label, count };
  }

  const byCat = new Map<string, number>();
  for (const o of orders) {
    const label = (o.categories ?? "").trim() || "Sin categoría";
    byCat.set(label, (byCat.get(label) ?? 0) + 1);
  }
  let topProducto: { label: string; pedidos: number } | null = null;
  for (const [label, pedidos] of byCat) {
    if (!topProducto || pedidos > topProducto.pedidos) topProducto = { label, pedidos };
  }

  return {
    totalPedidos,
    totalVendido,
    facturacionConfirmados,
    gananciaReal,
    gananciaEstimada,
    gananciaPromedioEntregado,
    inversionMeta,
    roasFacturacion,
    roasReal,
    cpa,
    aov,
    pctGananciaReal,
    pctGananciaEstimada,
    counts: {
      confirmados,
      entregados: delivered.length,
      pendientes: pending.length,
      novedades: issue.length,
      enDevolucion: returnFlow.length,
      cancelados: cancelled.length,
    },
    topRegionEntregados,
    topProducto,
  };
}

export type TopProductInsight = {
  label: string;
  pedidos: number;
  precioPromedio: number;
  pctEntregados: number;
  pctConfirmados: number;
  pctDevolucion: number;
  pctCancelados: number;
  breakevenPorPedido: number | null;
  profitNetoPorPedido: number | null;
  precioSugerido: number | null;
};

/**
 * KPIs del producto #1: precio medio, tasas por estado, y unidades económicas por pedido entregado.
 * Breakeven/pedido = coste variable medio (proveedor+flete+comisiones) + reparto proporcional de Meta / entregados.
 * Profit neto/pedido = ganancia bruta media entregado − reparto Meta por entregado.
 * Precio sugerido = breakeven × 1,30 (margen objetivo del 30 % sobre punto muerto).
 */
export function computeTopProductInsight(
  allOrdersInRange: DropiOrderForMetrics[],
  filters: DropiMetricsFilters,
  topLabel: string,
  metaSpend: number,
): TopProductInsight | null {
  const forAttribution = filterDropiOrders(allOrdersInRange, { region: "all", product: filters.product });
  const slice = forAttribution.filter((o) => ((o.categories ?? "").trim() || "Sin categoría") === topLabel);
  if (!slice.length) return null;

  const metaSlice = metaSpend * (slice.length / Math.max(forAttribution.length, 1));

  const delivered = slice.filter((o) => o.status_bucket === "delivered");
  const inTransit = slice.filter((o) => o.status_bucket === "in_transit");
  const ret = slice.filter((o) => o.status_bucket === "return_flow");
  const canc = slice.filter((o) => o.status_bucket === "cancelled");
  const n = slice.length;

  const nonCanc = slice.filter((o) => o.status_bucket !== "cancelled");
  const precioPromedio =
    nonCanc.length > 0 ? nonCanc.reduce((s, o) => s + saleAmount(o), 0) / nonCanc.length : 0;

  const avgVar =
    delivered.length > 0 ? delivered.reduce((s, o) => s + variableCost(o), 0) / delivered.length : 0;
  const adPerDel = delivered.length > 0 ? metaSlice / delivered.length : 0;
  const breakevenPorPedido = delivered.length > 0 ? avgVar + adPerDel : null;

  const avgProfitDel =
    delivered.length > 0 ? delivered.reduce((s, o) => s + profitAmount(o), 0) / delivered.length : 0;
  const profitNetoPorPedido = delivered.length > 0 ? avgProfitDel - adPerDel : null;

  let precioSugerido: number | null = null;
  if (breakevenPorPedido != null && breakevenPorPedido > 0) {
    precioSugerido = breakevenPorPedido * 1.3;
  }

  return {
    label: topLabel,
    pedidos: n,
    precioPromedio,
    pctEntregados: pct(delivered.length, n),
    pctConfirmados: pct(inTransit.length, n),
    pctDevolucion: pct(ret.length, n),
    pctCancelados: pct(canc.length, n),
    breakevenPorPedido,
    profitNetoPorPedido,
    precioSugerido,
  };
}

export type DailyProfitPoint = {
  date: string;
  gananciaReal: number;
  gananciaEstimada: number;
};

function eachDateIso(from: string, to: string): string[] {
  const out: string[] = [];
  const cur = new Date(from + "T12:00:00");
  const end = new Date(to + "T12:00:00");
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** Ganancia diaria: real = solo entregados; estimada = todos los no cancelados. */
export function computeDailyProfitTrend(
  orders: DropiOrderForMetrics[],
  fromIso: string,
  toIso: string,
): DailyProfitPoint[] {
  const days = eachDateIso(fromIso, toIso);
  const byDayReal = new Map<string, number>();
  const byDayEst = new Map<string, number>();
  for (const day of days) {
    byDayReal.set(day, 0);
    byDayEst.set(day, 0);
  }
  for (const o of orders) {
    const d = o.order_date.slice(0, 10);
    if (!byDayReal.has(d)) continue;
    if (o.status_bucket === "delivered") {
      byDayReal.set(d, (byDayReal.get(d) ?? 0) + profitAmount(o));
    }
    if (o.status_bucket !== "cancelled") {
      byDayEst.set(d, (byDayEst.get(d) ?? 0) + profitAmount(o));
    }
  }
  return days.map((date) => ({
    date,
    gananciaReal: byDayReal.get(date) ?? 0,
    gananciaEstimada: byDayEst.get(date) ?? 0,
  }));
}

export type RegionOrderCount = { region: string; count: number };

export function aggregateOrdersByRegion(orders: DropiOrderForMetrics[]): RegionOrderCount[] {
  const m = new Map<string, number>();
  for (const o of orders) {
    const k = regionKey(o);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);
}

export function attributedMetaSpend(metaSpend: number, sliceCount: number, baseCount: number): number {
  if (baseCount <= 0 || sliceCount <= 0) return 0;
  return metaSpend * (sliceCount / baseCount);
}

export function formatRoas(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${(Math.round(n * 100) / 100).toFixed(2)}x`;
}
