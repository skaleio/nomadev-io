import { clearDropiActiveImportId } from "@/features/dropi/lib/dropiSessionPrefs";

/**
 * Limpia el "import activo" del usuario al iniciar una nueva sesión.
 *
 * NO borra `dropi_orders`, `dropi_order_imports` ni `dropi_meta_spend_snapshots`:
 * los datos quedan en DB para acceder al historial. Solo deja el panel "vacío"
 * para que el usuario pueda subir una nueva guía o cargar una previa desde el historial.
 */
export async function resetDropiImportedDataForUser(userId: string): Promise<void> {
  if (!userId) return;
  clearDropiActiveImportId(userId);
}
