import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WHITE_BRAND_ID =
  Deno.env.get("DROPI_WHITE_BRAND_ID") ??
  "df3e6b0bb66ceaadca4f84cbc371fd66e04d20fe51fc414da8d1b84d31d178de";

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
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = useTest
      ? "https://test-api.dropi.co"
      : "https://api.dropi.co";
    const loginUrl = `${baseUrl}/api/login`;

    const response = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        white_brand_id: WHITE_BRAND_ID,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: data?.message ?? "Error al iniciar sesión en Dropi",
          status: response.status,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = data?.token ?? data?.data?.token;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Dropi no devolvió token" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ token, baseUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("dropi-login error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error de servidor" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
