import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type DropiAction =
  | "categories/list"
  | "products/list"
  | "products/get"
  | "orders/list"
  | "orders/get"
  | "departments"
  | "cities"
  | "transportadoras"
  | "historywallet";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { action, params = {}, id } = body as {
      action: DropiAction;
      params?: Record<string, unknown>;
      id?: number | string;
    };

    if (!action) {
      return new Response(JSON.stringify({ error: "Falta action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: config, error: configError } = await supabase
      .from("user_external_configs")
      .select("config_data")
      .eq("user_id", user.id)
      .eq("service_name", "dropi")
      .eq("is_active", true)
      .single();

    if (configError || !config?.config_data) {
      return new Response(
        JSON.stringify({ error: "No hay conexión con Dropi. Conecta primero en Ajustes / Dropi." }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { token, baseUrl } = config.config_data as { token?: string; baseUrl?: string };
    if (!token || !baseUrl) {
      return new Response(
        JSON.stringify({ error: "Token de Dropi no encontrado. Reconecta Dropi." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authHeader = { Authorization: `Bearer ${token}` };
    const base = baseUrl.replace(/\/$/, "");

    const doFetch = async (
      method: string,
      path: string,
      opts: { body?: Record<string, unknown>; query?: Record<string, string> } = {}
    ): Promise<Response> => {
      let url = `${base}${path}`;
      if (opts.query && Object.keys(opts.query).length > 0) {
        const q = new URLSearchParams(opts.query);
        url += `?${q.toString()}`;
      }
      return fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      });
    };

    let res: Response;

    switch (action) {
      case "categories/list": {
        res = await doFetch("GET", "/api/categories");
        break;
      }
      case "products/list": {
        res = await doFetch("POST", "/api/products/index", {
          body: {
            keywords: (params.keywords as string) ?? "",
            pageSize: (params.pageSize as number) ?? 50,
            startData: (params.startData as number) ?? 0,
            ...(params.userVerified !== undefined && { userVerified: params.userVerified }),
          },
        });
        break;
      }
      case "products/get": {
        const productId = id ?? params.id;
        if (productId == null) {
          return new Response(JSON.stringify({ error: "Falta id de producto" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        res = await doFetch("GET", `/api/products/${productId}`);
        break;
      }
      case "orders/list": {
        const q: Record<string, string> = {};
        if (params.result_number != null) q.result_number = String(params.result_number);
        if (params.start != null) q.start = String(params.start);
        if (params.textToSearch != null) q.textToSearch = String(params.textToSearch);
        if (params.from != null) q.from = String(params.from);
        if (params.untill != null) q.untill = String(params.untill);
        if (params.status != null) q.status = String(params.status);
        if (params.orderBy != null) q.orderBy = String(params.orderBy);
        if (params.orderDirection != null) q.orderDirection = String(params.orderDirection);
        if (params.filter_date_by != null) q.filter_date_by = String(params.filter_date_by);
        if (params.radio_downloaded != null) q.radio_downloaded = String(params.radio_downloaded);
        if (params.filter_by != null) q.filter_by = String(params.filter_by);
        if (params.value_filter_by != null) q.value_filter_by = String(params.value_filter_by);
        res = await doFetch("GET", "/api/orders/myorders", { query: q });
        break;
      }
      case "orders/get": {
        const orderId = id ?? params.id;
        if (orderId == null) {
          return new Response(JSON.stringify({ error: "Falta id de orden" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        res = await doFetch("GET", `/api/orders/myorders/${orderId}`);
        break;
      }
      case "departments": {
        res = await doFetch("GET", "/api/department");
        break;
      }
      case "cities": {
        res = await doFetch("POST", "/api/trajectory/bycity", {
          body: {
            department_id: params.department_id,
            rate_type: (params.rate_type as string) ?? "",
          },
        });
        break;
      }
      case "transportadoras": {
        res = await doFetch("GET", "/api/distribution_companies");
        break;
      }
      case "historywallet": {
        const q: Record<string, string> = {};
        if (params.result_number != null) q.result_number = String(params.result_number);
        if (params.start != null) q.start = String(params.start);
        if (params.from != null) q.from = String(params.from);
        if (params.untill != null) q.untill = String(params.untill);
        if (params.orderBy != null) q.orderBy = String(params.orderBy);
        if (params.orderDirection != null) q.orderDirection = String(params.orderDirection);
        if (params.type != null) q.type = String(params.type);
        res = await doFetch("GET", "/api/historywallet", { query: q });
        break;
      }
      default:
        return new Response(
          JSON.stringify({ error: `Acción no soportada: ${action}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    const data = await res.json().catch(() => ({}));

    if (res.status === 401 && data?.message === "Token is Expired") {
      return new Response(
        JSON.stringify({
          error: "Sesión de Dropi expirada. Reconecta desde Conectar Dropi.",
          code: "TOKEN_EXPIRED",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("dropi-api error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error de servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
