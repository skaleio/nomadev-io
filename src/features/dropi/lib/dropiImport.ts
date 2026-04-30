import * as XLSX from "xlsx";
import type { DropiStatusBucket, Json } from "@/lib/supabase/types";

export type { DropiStatusBucket };

export type DropiOrderRow = {
  dropi_numeric_id: number;
  report_date: string | null;
  order_date: string;
  order_time: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  status_raw: string;
  status_bucket: DropiStatusBucket;
  department: string | null;
  city: string | null;
  address: string | null;
  notes: string | null;
  carrier: string | null;
  guide_number: string | null;
  invoice_number: string | null;
  invoiced_amount: number | null;
  product_sale_amount: number | null;
  profit: number | null;
  shipping_price: number | null;
  return_shipping_cost: number | null;
  commission: number | null;
  supplier_total: number | null;
  categories: string | null;
  store_name: string | null;
  store_order_id: string | null;
  shop_order_number: string | null;
  raw: Record<string, unknown>;
};

const HEADER_CANDIDATES: Record<string, string[]> = {
  id: ["ID"],
  reportDate: ["FECHA DE REPORTE"],
  orderTime: ["HORA"],
  orderDate: ["FECHA"],
  customerName: ["NOMBRE CLIENTE"],
  phone: ["TELÉFONO", "TELEFONO"],
  email: ["EMAIL"],
  status: ["ESTATUS"],
  department: ["DEPARTAMENTO DESTINO"],
  city: ["CIUDAD DESTINO"],
  address: ["DIRECCION", "DIRECCIÓN"],
  notes: ["NOTAS"],
  carrier: ["TRANSPORTADORA"],
  guideNumber: ["NÚMERO GUIA", "NUMERO GUIA", "N° GUIA", "NÚMERO GUÍA"],
  invoiceNumber: ["NUMERO DE FACTURA", "NÚMERO DE FACTURA"],
  invoicedAmount: ["VALOR FACTURADO"],
  productSale: ["VALOR DE COMPRA EN PRODUCTOS"],
  profit: ["GANANCIA"],
  shippingPrice: ["PRECIO FLETE"],
  returnShipping: ["COSTO DEVOLUCION FLETE", "COSTO DEVOLUCIÓN FLETE"],
  commission: ["COMISION", "COMISIÓN"],
  supplierTotal: ["TOTAL EN PRECIOS DE PROVEEDOR"],
  categories: ["CATEGORÍAS", "CATEGORIAS"],
  storeName: ["TIENDA"],
  storeOrderId: ["ID DE ORDEN DE TIENDA"],
  shopOrderNumber: ["NUMERO DE PEDIDO DE TIENDA", "NÚMERO DE PEDIDO DE TIENDA"],
};

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toUpperCase().trim();
}

function buildHeaderMap(headers: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const h of headers) {
    if (!h) continue;
    map.set(stripAccents(String(h)), String(h));
  }
  return map;
}

function pickColumn(row: Record<string, unknown>, headerMap: Map<string, string>, candidates: string[]): string | undefined {
  for (const c of candidates) {
    const key = headerMap.get(stripAccents(c));
    if (key !== undefined && key in row) return key;
  }
  return undefined;
}

function cellString(row: Record<string, unknown>, col?: string): string | null {
  if (!col) return null;
  const v = row[col];
  if (v === undefined || v === null || v === "") return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim() || null;
}

function toNumber(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const s = String(v).trim().replace(/\s/g, "");
  if (!s) return null;
  const normalized = s.includes(",") && !s.includes(".") ? s.replace(",", ".") : s.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function cellNumber(row: Record<string, unknown>, col?: string): number | null {
  if (!col) return null;
  return toNumber(row[col]);
}

/** FECHA column: DD-MM-YYYY o Excel serial */
function parseOrderDate(raw: unknown, colName?: string): string | null {
  if (raw === undefined || raw === null || raw === "") return null;
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }
  const s = String(raw).trim();
  const dmY = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(s);
  if (dmY) {
    const d = dmY[1].padStart(2, "0");
    const m = dmY[2].padStart(2, "0");
    const y = dmY[3];
    return `${y}-${m}-${d}`;
  }
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (ymd) return s.slice(0, 10);
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (slash) {
    const d = slash[1].padStart(2, "0");
    const m = slash[2].padStart(2, "0");
    const y = slash[3];
    return `${y}-${m}-${d}`;
  }
  return null;
}

export function mapDropiStatusBucket(statusRaw: string): DropiStatusBucket {
  const s = stripAccents(statusRaw || "");
  if (!s) return "in_transit";
  if (s.includes("CANCELADO") || s.includes("RECHAZ") || s.includes("ANUL")) return "cancelled";
  if (s.includes("ENTREGADO")) return "delivered";
  if (s.includes("DEVOLUC")) return "return_flow";
  if (s.includes("NOVEDAD") || s.includes("REHUZA")) return "issue";
  if (s.includes("PENDIENT")) return "pending";
  return "in_transit";
}

export function parseDropiXlsxArrayBuffer(buf: ArrayBuffer): DropiOrderRow[] {
  const wb = XLSX.read(buf, { type: "array", cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  if (!rows.length) return [];

  const headerMap = buildHeaderMap(Object.keys(rows[0]));
  const out: DropiOrderRow[] = [];

  for (const row of rows) {
    const idCol = pickColumn(row, headerMap, HEADER_CANDIDATES.id);
    const idNum = cellNumber(row, idCol);
    if (idNum == null || !Number.isFinite(idNum)) continue;

    const statusCol = pickColumn(row, headerMap, HEADER_CANDIDATES.status);
    const statusRaw = (statusCol ? String(row[statusCol] ?? "").trim() : "") || "DESCONOCIDO";

    const fechaCol = pickColumn(row, headerMap, HEADER_CANDIDATES.orderDate);
    const orderDate = parseOrderDate(fechaCol ? row[fechaCol] : null, fechaCol);

    if (!orderDate) continue;

    const reportCol = pickColumn(row, headerMap, HEADER_CANDIDATES.reportDate);
    const reportDate = reportCol ? parseOrderDate(row[reportCol], reportCol) : null;

    const timeCol = pickColumn(row, headerMap, HEADER_CANDIDATES.orderTime);
    const orderTime = cellString(row, timeCol);

    const nameCol = pickColumn(row, headerMap, HEADER_CANDIDATES.customerName);
    const phoneCol = pickColumn(row, headerMap, HEADER_CANDIDATES.phone);
    const emailCol = pickColumn(row, headerMap, HEADER_CANDIDATES.email);

    const deptCol = pickColumn(row, headerMap, HEADER_CANDIDATES.department);
    const cityCol = pickColumn(row, headerMap, HEADER_CANDIDATES.city);
    const addrCol = pickColumn(row, headerMap, HEADER_CANDIDATES.address);
    const notesCol = pickColumn(row, headerMap, HEADER_CANDIDATES.notes);
    const carrierCol = pickColumn(row, headerMap, HEADER_CANDIDATES.carrier);
    const guideCol = pickColumn(row, headerMap, HEADER_CANDIDATES.guideNumber);
    const invNumCol = pickColumn(row, headerMap, HEADER_CANDIDATES.invoiceNumber);
    const invAmtCol = pickColumn(row, headerMap, HEADER_CANDIDATES.invoicedAmount);
    const saleCol = pickColumn(row, headerMap, HEADER_CANDIDATES.productSale);
    const profitCol = pickColumn(row, headerMap, HEADER_CANDIDATES.profit);
    const shipCol = pickColumn(row, headerMap, HEADER_CANDIDATES.shippingPrice);
    const retShipCol = pickColumn(row, headerMap, HEADER_CANDIDATES.returnShipping);
    const commCol = pickColumn(row, headerMap, HEADER_CANDIDATES.commission);
    const supCol = pickColumn(row, headerMap, HEADER_CANDIDATES.supplierTotal);
    const catCol = pickColumn(row, headerMap, HEADER_CANDIDATES.categories);
    const storeCol = pickColumn(row, headerMap, HEADER_CANDIDATES.storeName);
    const soidCol = pickColumn(row, headerMap, HEADER_CANDIDATES.storeOrderId);
    const shopNumCol = pickColumn(row, headerMap, HEADER_CANDIDATES.shopOrderNumber);

    const raw: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      if (v instanceof Date) raw[k] = v.toISOString();
      else raw[k] = v as unknown;
    }

    out.push({
      dropi_numeric_id: Math.round(idNum),
      report_date: reportDate,
      order_date: orderDate,
      order_time: orderTime,
      customer_name: cellString(row, nameCol),
      customer_phone: cellString(row, phoneCol),
      customer_email: cellString(row, emailCol),
      status_raw: statusRaw,
      status_bucket: mapDropiStatusBucket(statusRaw),
      department: cellString(row, deptCol),
      city: cellString(row, cityCol),
      address: cellString(row, addrCol),
      notes: cellString(row, notesCol),
      carrier: cellString(row, carrierCol),
      guide_number: cellString(row, guideCol),
      invoice_number: cellString(row, invNumCol),
      invoiced_amount: cellNumber(row, invAmtCol),
      product_sale_amount: cellNumber(row, saleCol),
      profit: cellNumber(row, profitCol),
      shipping_price: cellNumber(row, shipCol),
      return_shipping_cost: cellNumber(row, retShipCol),
      commission: cellNumber(row, commCol),
      supplier_total: cellNumber(row, supCol),
      categories: cellString(row, catCol),
      store_name: cellString(row, storeCol),
      store_order_id: cellString(row, soidCol),
      shop_order_number: cellString(row, shopNumCol),
      raw,
    });
  }

  return out;
}

export function toSupabaseInsertRows(
  userId: string,
  importId: string,
  parsed: DropiOrderRow[],
): Array<{
  user_id: string;
  import_id: string;
  dropi_numeric_id: number;
  report_date: string | null;
  order_date: string;
  order_time: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  status_raw: string;
  status_bucket: DropiStatusBucket;
  department: string | null;
  city: string | null;
  address: string | null;
  notes: string | null;
  carrier: string | null;
  guide_number: string | null;
  invoice_number: string | null;
  invoiced_amount: number | null;
  product_sale_amount: number | null;
  profit: number | null;
  shipping_price: number | null;
  return_shipping_cost: number | null;
  commission: number | null;
  supplier_total: number | null;
  categories: string | null;
  store_name: string | null;
  store_order_id: string | null;
  shop_order_number: string | null;
  raw: Json;
}> {
  return parsed.map((p) => ({
    user_id: userId,
    import_id: importId,
    dropi_numeric_id: p.dropi_numeric_id,
    report_date: p.report_date,
    order_date: p.order_date,
    order_time: p.order_time,
    customer_name: p.customer_name,
    customer_phone: p.customer_phone,
    customer_email: p.customer_email,
    status_raw: p.status_raw,
    status_bucket: p.status_bucket,
    department: p.department,
    city: p.city,
    address: p.address,
    notes: p.notes,
    carrier: p.carrier,
    guide_number: p.guide_number,
    invoice_number: p.invoice_number,
    invoiced_amount: p.invoiced_amount,
    product_sale_amount: p.product_sale_amount,
    profit: p.profit,
    shipping_price: p.shipping_price,
    return_shipping_cost: p.return_shipping_cost,
    commission: p.commission,
    supplier_total: p.supplier_total,
    categories: p.categories,
    store_name: p.store_name,
    store_order_id: p.store_order_id,
    shop_order_number: p.shop_order_number,
    raw: p.raw as Json,
  }));
}
