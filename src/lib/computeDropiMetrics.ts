import type { DropiStatusBucket } from "@/lib/dropiImport";

export type DropiOrderForMetrics = {
  status_bucket: DropiStatusBucket;
  order_date: string;
  department: string | null;
  city: string | null;
  categories: string | null;
  carrier: string | null;
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
  carrier: string;
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

export function carrierKey(o: DropiOrderForMetrics): string {
  return (o.carrier ?? "").trim() || "Sin transportadora";
}

function matchesCarrier(o: DropiOrderForMetrics, carrier: string): boolean {
  if (carrier === "all") return true;
  return carrierKey(o) === carrier;
}

function variableCost(o: DropiOrderForMetrics): number {
  return (
    (o.supplier_total ?? 0) +
    (o.shipping_price ?? 0) +
    (o.commission ?? 0) +
    (o.return_shipping_cost ?? 0)
  );
}

/** Margen por pedido antes de comisiones/devoluciones/Meta: precio venta − flete − costo proveedor (campos del Excel). */
function contributionSaleMinusShippingAndProduct(o: DropiOrderForMetrics): number {
  return saleAmount(o) - (o.shipping_price ?? 0) - (o.supplier_total ?? 0);
}

export function filterDropiOrders<T extends DropiOrderForMetrics>(orders: T[], f: DropiMetricsFilters): T[] {
  return orders.filter(
    (o) => matchesRegion(o, f.region) && matchesProduct(o, f.product) && matchesCarrier(o, f.carrier),
  );
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
  roasVentas: number | null;
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
 * - ROAS ventas: total vendido / inversión Meta.
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
  const roasVentas = inversionMeta > 0 ? totalVendido / inversionMeta : null;
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
    roasVentas,
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
  /** Meta atribuida a esta categoría / pedidos entregados (misma lógica que CPA global). */
  cpa: number | null;
  breakevenPorPedido: number | null;
  profitNetoPorPedido: number | null;
  precioSugerido: number | null;
};

function productCategoryLabel(o: DropiOrderForMetrics): string {
  return (o.categories ?? "").trim() || "Sin categoría";
}

function buildProductInsight(label: string, slice: DropiOrderForMetrics[], metaSlice: number): TopProductInsight | null {
  if (!slice.length) return null;

  const delivered = slice.filter((o) => o.status_bucket === "delivered");
  const inTransit = slice.filter((o) => o.status_bucket === "in_transit");
  const ret = slice.filter((o) => o.status_bucket === "return_flow");
  const canc = slice.filter((o) => o.status_bucket === "cancelled");
  const n = slice.length;

  const nonCanc = slice.filter((o) => o.status_bucket !== "cancelled");
  const precioPromedio =
    nonCanc.length > 0 ? nonCanc.reduce((s, o) => s + saleAmount(o), 0) / nonCanc.length : 0;

  const adPerDel = delivered.length > 0 ? metaSlice / delivered.length : 0;
  const breakevenPorPedido =
    delivered.length > 0
      ? delivered.reduce((s, o) => s + contributionSaleMinusShippingAndProduct(o), 0) / delivered.length
      : null;

  const avgProfitDel =
    delivered.length > 0 ? delivered.reduce((s, o) => s + profitAmount(o), 0) / delivered.length : 0;
  const profitNetoPorPedido = delivered.length > 0 ? avgProfitDel - adPerDel : null;

  let precioSugerido: number | null = null;
  if (breakevenPorPedido != null && breakevenPorPedido > 0) {
    precioSugerido = breakevenPorPedido * 1.3;
  }

  const entCount = delivered.length;
  const cpa = metaSlice > 0 && entCount > 0 ? metaSlice / entCount : null;

  return {
    label,
    pedidos: n,
    precioPromedio,
    pctEntregados: pct(delivered.length, n),
    pctConfirmados: pct(inTransit.length, n),
    pctDevolucion: pct(ret.length, n),
    pctCancelados: pct(canc.length, n),
    cpa,
    breakevenPorPedido,
    profitNetoPorPedido,
    precioSugerido,
  };
}

export type ProductInsightsBreakdown = {
  general: TopProductInsight | null;
  byProduct: TopProductInsight[];
};

/**
 * Resumen general (todas las categorías del slice) + una tarjeta por categoría importada.
 * Respeta región y transportadora del filtro; ignora filtro de producto para listar todas las categorías.
 * Meta se prorratea por volumen de pedidos en cada categoría; en "general" se usa el gasto completo.
 */
export function computeAllProductInsights(
  allOrdersInRange: DropiOrderForMetrics[],
  filters: DropiMetricsFilters,
  metaSpend: number,
): ProductInsightsBreakdown {
  const forAttribution = filterDropiOrders(allOrdersInRange, {
    region: filters.region,
    product: "all",
    carrier: filters.carrier,
  });
  if (!forAttribution.length) return { general: null, byProduct: [] };

  const general = buildProductInsight("General (todas las categorías)", forAttribution, metaSpend);

  const byLabel = new Map<string, DropiOrderForMetrics[]>();
  for (const o of forAttribution) {
    const lab = productCategoryLabel(o);
    const arr = byLabel.get(lab) ?? [];
    arr.push(o);
    byLabel.set(lab, arr);
  }
  const baseLen = forAttribution.length;
  const byProduct = [...byLabel.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "es"))
    .map(([lab, slice]) => {
      const metaSlice = metaSpend * (slice.length / Math.max(baseLen, 1));
      return buildProductInsight(lab, slice, metaSlice);
    })
    .filter((x): x is TopProductInsight => x != null);

  return { general, byProduct };
}

/**
 * KPIs del producto #1: precio medio, tasas por estado, y unidades económicas por pedido entregado.
 * Breakeven/pedido = promedio en entregados de (valor venta − flete − costo proveedor), según columnas del Excel.
 * Profit neto/pedido = ganancia bruta media entregado − reparto Meta por entregado.
 * Precio sugerido = breakeven × 1,30 (margen orientativo).
 */
export function computeTopProductInsight(
  allOrdersInRange: DropiOrderForMetrics[],
  filters: DropiMetricsFilters,
  topLabel: string,
  metaSpend: number,
): TopProductInsight | null {
  const forAttribution = filterDropiOrders(allOrdersInRange, {
    region: "all",
    product: filters.product,
    carrier: filters.carrier,
  });
  const slice = forAttribution.filter((o) => productCategoryLabel(o) === topLabel);
  if (!slice.length) return null;

  const metaSlice = metaSpend * (slice.length / Math.max(forAttribution.length, 1));
  return buildProductInsight(topLabel, slice, metaSlice);
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

/** Conteos por región para gráfico apilado (entregas, devoluciones, cancelados, en tránsito + otros). */
export type RegionStatusStackRow = {
  region: string;
  delivered: number;
  return_flow: number;
  cancelled: number;
  in_transit: number;
  /** pending, issue, etc. */
  other: number;
  total: number;
};

export function aggregateOrdersByRegionStatusStack(orders: DropiOrderForMetrics[]): RegionStatusStackRow[] {
  const m = new Map<string, { delivered: number; return_flow: number; cancelled: number; in_transit: number; other: number }>();
  for (const o of orders) {
    const k = regionKey(o);
    const cur = m.get(k) ?? { delivered: 0, return_flow: 0, cancelled: 0, in_transit: 0, other: 0 };
    switch (o.status_bucket) {
      case "delivered":
        cur.delivered += 1;
        break;
      case "return_flow":
        cur.return_flow += 1;
        break;
      case "cancelled":
        cur.cancelled += 1;
        break;
      case "in_transit":
        cur.in_transit += 1;
        break;
      default:
        cur.other += 1;
        break;
    }
    m.set(k, cur);
  }
  return [...m.entries()]
    .map(([region, v]) => ({
      region,
      ...v,
      total: v.delivered + v.return_flow + v.cancelled + v.in_transit + v.other,
    }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);
}

export type RegionDeliveryDaysRow = {
  region: string;
  /** Días promedio entre FECHA y FECHA DE REPORTE para entregados. */
  avgDays: number;
  /** Cantidad de entregados con fechas válidas usados en el promedio. */
  deliveredCount: number;
};

function dayDiff(fromIso: string, toIso: string): number | null {
  const a = new Date(fromIso + "T12:00:00");
  const b = new Date(toIso + "T12:00:00");
  const ms = b.getTime() - a.getTime();
  if (!Number.isFinite(ms)) return null;
  const days = ms / 86_400_000;
  if (!Number.isFinite(days)) return null;
  // No permitimos negativos por datos inconsistentes.
  return Math.max(0, days);
}

/**
 * Días promedio de entrega por región (Chile) usando solo pedidos ENTREGADOS.
 * Aproximación: diferencia entre `order_date` (FECHA) y `report_date` (FECHA DE REPORTE) del Excel.
 */
export function aggregateDeliveryDaysByRegion(orders: DropiOrderForMetrics[]): RegionDeliveryDaysRow[] {
  const m = new Map<string, { sum: number; n: number }>();
  for (const o of orders) {
    if (o.status_bucket !== "delivered") continue;
    const rd = (o.report_date ?? "").slice(0, 10);
    const od = (o.order_date ?? "").slice(0, 10);
    if (!rd || !od) continue;
    const d = dayDiff(od, rd);
    if (d == null) continue;
    const k = regionKey(o);
    const cur = m.get(k) ?? { sum: 0, n: 0 };
    cur.sum += d;
    cur.n += 1;
    m.set(k, cur);
  }
  return [...m.entries()]
    .map(([region, v]) => ({
      region,
      avgDays: v.n > 0 ? Math.round((v.sum / v.n) * 10) / 10 : 0,
      deliveredCount: v.n,
    }))
    /** Mayor demora a la izquierda (mismo criterio visual que “Pedidos por región” con barras descendentes). */
    .sort((a, b) => b.avgDays - a.avgDays || b.deliveredCount - a.deliveredCount || a.region.localeCompare(b.region, "es"));
}

export function attributedMetaSpend(metaSpend: number, sliceCount: number, baseCount: number): number {
  if (baseCount <= 0 || sliceCount <= 0) return 0;
  return metaSpend * (sliceCount / baseCount);
}

export type CarrierOrderCount = { carrier: string; count: number };

export function aggregateOrdersByCarrier(orders: DropiOrderForMetrics[]): CarrierOrderCount[] {
  const m = new Map<string, number>();
  for (const o of orders) {
    const k = carrierKey(o);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([carrier, count]) => ({ carrier, count }))
    .sort((a, b) => b.count - a.count);
}

export type RegionBreakdownRow = {
  region: string;
  metrics: DropiDashboardMetrics;
  metaAttributed: number;
};

/**
 * Devuelve métricas completas (cantidades, %, KPIs económicos) para cada región
 * presente en el dataset, ordenadas por volumen de pedidos. La inversión Meta se
 * reparte proporcionalmente al peso de la región sobre el total filtrado.
 */
export function computeMetricsByRegion(
  orders: DropiOrderForMetrics[],
  metaSpend: number,
): RegionBreakdownRow[] {
  if (orders.length === 0) return [];
  const buckets = new Map<string, DropiOrderForMetrics[]>();
  for (const o of orders) {
    const k = regionKey(o);
    const arr = buckets.get(k) ?? [];
    arr.push(o);
    buckets.set(k, arr);
  }
  const rows: RegionBreakdownRow[] = [];
  for (const [region, slice] of buckets) {
    const meta = attributedMetaSpend(metaSpend, slice.length, orders.length);
    rows.push({ region, metrics: computeDropiMetrics(slice, meta), metaAttributed: meta });
  }
  rows.sort((a, b) => b.metrics.totalPedidos - a.metrics.totalPedidos);
  return rows;
}

export type CarrierBreakdownRow = {
  carrier: string;
  metrics: DropiDashboardMetrics;
  metaAttributed: number;
};

export function computeMetricsByCarrier(
  orders: DropiOrderForMetrics[],
  metaSpend: number,
): CarrierBreakdownRow[] {
  if (orders.length === 0) return [];
  const buckets = new Map<string, DropiOrderForMetrics[]>();
  for (const o of orders) {
    const k = carrierKey(o);
    const arr = buckets.get(k) ?? [];
    arr.push(o);
    buckets.set(k, arr);
  }
  const rows: CarrierBreakdownRow[] = [];
  for (const [carrier, slice] of buckets) {
    const meta = attributedMetaSpend(metaSpend, slice.length, orders.length);
    rows.push({ carrier, metrics: computeDropiMetrics(slice, meta), metaAttributed: meta });
  }
  rows.sort((a, b) => b.metrics.totalPedidos - a.metrics.totalPedidos);
  return rows;
}

/** Detecta el rango (min/max order_date) de una colección de pedidos parseados. */
export function detectDateRange(orderDates: Array<string | null | undefined>): { from: string; to: string } | null {
  let min: string | null = null;
  let max: string | null = null;
  for (const d of orderDates) {
    if (!d) continue;
    const s = d.slice(0, 10);
    if (min == null || s < min) min = s;
    if (max == null || s > max) max = s;
  }
  if (!min || !max) return null;
  return { from: min, to: max };
}

export function formatRoas(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${(Math.round(n * 100) / 100).toFixed(2)}x`;
}
