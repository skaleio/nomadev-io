import { supabase } from "@/integrations/supabase/client";

const getSupabaseUrl = () => import.meta.env.VITE_SUPABASE_URL;
const getAnonKey = () => import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Llama a la Edge Function dropi-login y devuelve { token, baseUrl }.
 * La función siempre devuelve 200; los errores vienen en body.error para poder mostrar el mensaje de Dropi. */
export async function dropiLogin(
  email: string,
  password: string,
  useTest = false
): Promise<{ token: string; baseUrl: string }> {
  const { data, error } = await supabase.functions.invoke("dropi-login", {
    body: { email, password, useTest },
  });

  if (error) {
    throw new Error(error.message || "Error al conectar con la función de Dropi");
  }
  if (data?.error) {
    throw new Error(data.error);
  }
  if (!data?.token || !data?.baseUrl) {
    throw new Error("Dropi no devolvió token");
  }

  return { token: data.token, baseUrl: data.baseUrl };
}

/** Guarda la configuración de Dropi en user_external_configs */
export async function saveDropiConfig(
  token: string,
  baseUrl: string,
  email: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  const configData = { token, baseUrl, email };

  const { error } = await supabase.from("user_external_configs").upsert(
    {
      user_id: user.id,
      service_name: "dropi",
      config_data: configData,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,service_name" }
  );

  if (error) throw error;
}

/** Elimina la conexión Dropi del usuario */
export async function disconnectDropi(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  const { error } = await supabase
    .from("user_external_configs")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("service_name", "dropi");

  if (error) throw error;
}

/** Tipos de acción soportados por dropi-api */
export type DropiAction =
  | "categories/list"
  | "products/list"
  | "products/get"
  | "orders/list"
  | "orders/get"
  | "departments"
  | "cities"
  | "transportadoras"
  | "historywallet";

/** Llama a la Edge Function dropi-api (proxy a Dropi) */
export async function dropiApi<T = unknown>(
  action: DropiAction,
  params?: Record<string, unknown>,
  id?: number | string
): Promise<T> {
  const url = `${getSupabaseUrl()}/functions/v1/dropi-api`;
  const session = (await supabase.auth.getSession()).data.session;
  if (!session?.access_token) throw new Error("No autorizado");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ action, params, id }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.error ?? `Error ${res.status}`;
    const err = new Error(msg) as Error & { code?: string };
    err.code = data?.code;
    throw err;
  }

  return data as T;
}

/** Helpers de uso común */
export const dropi = {
  categories: () => dropiApi("categories/list"),
  products: (opts?: { keywords?: string; pageSize?: number; startData?: number }) =>
    dropiApi("products/list", {
      keywords: opts?.keywords ?? "",
      pageSize: opts?.pageSize ?? 50,
      startData: opts?.startData ?? 0,
    }),
  product: (id: number | string) => dropiApi("products/get", undefined, id),
  orders: (opts?: {
    result_number?: number;
    start?: number;
    from?: string;
    untill?: string;
    status?: string;
    orderBy?: string;
    orderDirection?: string;
    filter_date_by?: string;
  }) => dropiApi("orders/list", opts as Record<string, unknown>),
  order: (id: number | string) => dropiApi("orders/get", undefined, id),
  departments: () => dropiApi("departments"),
  cities: (departmentId: number, rateType?: string) =>
    dropiApi("cities", { department_id: departmentId, rate_type: rateType ?? "" }),
  transportadoras: () => dropiApi("transportadoras"),
  historywallet: (opts?: {
    result_number?: number;
    start?: number;
    from?: string;
    untill?: string;
  }) => dropiApi("historywallet", opts as Record<string, unknown>),
};
