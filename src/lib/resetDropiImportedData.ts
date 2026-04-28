import { supabase } from "@/integrations/supabase/client";

function shouldResetDropiDataOnLogin(userId: string): boolean {
  if (!userId || userId === "test-user-12345") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
}

/**
 * Borra guías Dropi importadas del usuario (pedidos, snapshots Meta e historial de importaciones).
 * Solo para UUID reales de Supabase Auth; no afecta login de prueba local.
 */
export async function resetDropiImportedDataForUser(userId: string): Promise<void> {
  if (!shouldResetDropiDataOnLogin(userId)) return;

  const { error: e1 } = await supabase.from("dropi_orders").delete().eq("user_id", userId);
  if (e1) console.warn("[resetDropi] dropi_orders", e1.message);
  const { error: e2 } = await supabase.from("dropi_meta_spend_snapshots").delete().eq("user_id", userId);
  if (e2) console.warn("[resetDropi] dropi_meta_spend_snapshots", e2.message);
  const { error: e3 } = await supabase.from("dropi_order_imports").delete().eq("user_id", userId);
  if (e3) console.warn("[resetDropi] dropi_order_imports", e3.message);
}
