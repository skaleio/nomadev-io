import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WHITE_BRAND_ID = Deno.env.get("DROPI_WHITE_BRAND_ID");
if (!WHITE_BRAND_ID) {
  console.error(
    "dropi-login: DROPI_WHITE_BRAND_ID no está configurado. Configurá este secret en Supabase Edge Functions."
  );
}

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
    const { email, password, useTest } = (await req.json()) as {
      email?: string;
      password?: string;
      useTest?: boolean;
    };

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Faltan email o contraseña" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!WHITE_BRAND_ID) {
      return new Response(
        JSON.stringify({ error: "Configuración incompleta: DROPI_WHITE_BRAND_ID no está seteado." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = useTest
      ? "https://test-api.dropi.co"
      : "https://api.dropi.co";
    const loginUrl = `${baseUrl}/api/login`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          white_brand_id: WHITE_BRAND_ID,
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isAbort = fetchErr instanceof DOMException && fetchErr.name === "AbortError";
      return new Response(
        JSON.stringify({
          error: isAbort
            ? "Dropi no respondió a tiempo. Intentá de nuevo."
            : "No pudimos conectar con Dropi. Verificá tu conexión.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const msg = data?.message ?? data?.error ?? "Error al iniciar sesión en Dropi";
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = data?.token ?? data?.data?.token;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Dropi no devolvió token" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ token, baseUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("dropi-login error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error de servidor" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
