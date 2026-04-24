import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SHOPIFY_API_VERSION = "2024-01";

interface ShopifyOrder {
  id: number;
  name: string;
  order_number?: number;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  total_price?: string;
  currency?: string;
  financial_status?: string | null;
  fulfillment_status?: string | null;
  cancelled_at?: string | null;
  gateway?: string;
  payment_gateway_names?: string[];
  customer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  } | null;
  shipping_address?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
  } | null;
  line_items?: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
  }>;
}

function mapStatus(order: ShopifyOrder): string {
  if (order.cancelled_at) return "rejected";
  const fulfillment = order.fulfillment_status ?? null;
  if (fulfillment === "fulfilled") return "delivered";
  if (fulfillment === "partial") return "shipped";
  const financial = order.financial_status ?? null;
  if (financial === "paid") return "validated";
  if (financial === "refunded" || financial === "voided") return "rejected";
  return "pending_validation";
}

function formatAddress(addr: ShopifyOrder["shipping_address"]): string {
  if (!addr) return "";
  const parts = [addr.address1, addr.address2, addr.city, addr.province, addr.zip, addr.country];
  return parts.filter(Boolean).join(", ");
}

function mapOrder(order: ShopifyOrder) {
  const customerName =
    [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(" ").trim() ||
    [order.shipping_address?.first_name, order.shipping_address?.last_name].filter(Boolean).join(" ").trim() ||
    "Cliente";

  return {
    id: String(order.id),
    order_number: order.name || `#${order.order_number ?? order.id}`,
    customer_name: customerName,
    customer_phone: order.customer?.phone || order.shipping_address?.phone || order.phone || "",
    customer_email: order.email || order.customer?.email || "",
    status: mapStatus(order),
    priority: "medium" as const,
    total_amount: parseFloat(order.total_price ?? "0"),
    currency: order.currency ?? "USD",
    items: (order.line_items ?? []).map((item) => ({
      name: item.title,
      quantity: item.quantity,
      price: parseFloat(item.price ?? "0"),
    })),
    shipping_address: formatAddress(order.shipping_address),
    payment_method: order.gateway || order.payment_gateway_names?.join(", ") || "",
    created_at: order.created_at,
    updated_at: order.updated_at,
    requires_validation: false,
    validation_reason: "",
  };
}

function parseNextPageInfo(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  if (!match) return null;
  try {
    const url = new URL(match[1]);
    return url.searchParams.get("page_info");
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 250);
    const status = url.searchParams.get("status") ?? "any";
    const pageInfo = url.searchParams.get("page_info");

    // Leer credenciales con service role (token nunca sale del servidor).
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: connection, error: connError } = await supabaseAdmin
      .from("shopify_connections")
      .select("shop_domain, access_token")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (connError) {
      console.error("Error leyendo shopify_connections:", connError);
      return new Response(JSON.stringify({ error: "Error leyendo conexión Shopify" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!connection?.shop_domain || !connection?.access_token) {
      return new Response(
        JSON.stringify({
          error: "No hay tienda Shopify conectada",
          code: "NOT_CONNECTED",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const shopDomain = connection.shop_domain.includes(".myshopify.com")
      ? connection.shop_domain
      : `${connection.shop_domain}.myshopify.com`;

    const params = new URLSearchParams({ limit: String(limit) });
    if (pageInfo) {
      params.set("page_info", pageInfo);
    } else {
      params.set("status", status);
    }

    const shopifyUrl = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/orders.json?${params.toString()}`;
    const shopifyResp = await fetch(shopifyUrl, {
      headers: {
        "X-Shopify-Access-Token": connection.access_token,
        "Content-Type": "application/json",
      },
    });

    if (!shopifyResp.ok) {
      const errorText = await shopifyResp.text();
      console.error("Shopify API error:", shopifyResp.status, errorText);
      const code = shopifyResp.status === 401 ? "INVALID_TOKEN" : "SHOPIFY_API_ERROR";
      return new Response(
        JSON.stringify({
          error: "Error consultando Shopify",
          code,
          status: shopifyResp.status,
          details: errorText,
        }),
        {
          status: shopifyResp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await shopifyResp.json();
    const orders: ShopifyOrder[] = data.orders ?? [];
    const mapped = orders.map(mapOrder);
    const nextPageInfo = parseNextPageInfo(shopifyResp.headers.get("link"));

    return new Response(
      JSON.stringify({
        orders: mapped,
        next_page_info: nextPageInfo,
        shop_domain: shopDomain,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error en shopify-orders:", error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
