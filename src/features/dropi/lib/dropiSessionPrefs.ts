const STORAGE_KEY_PREFIX = "nomadev:dropi-panel:";
const ACTIVE_IMPORT_KEY_PREFIX = "nomadev:dropi-active-import:";

/** Se pone en true justo antes de signIn; en SIGNED_IN se consume para saber que es un login nuevo (no recuperación de sesión al refrescar). */
export const DROP_EXPECT_FRESH_LOGIN_KEY = "nomadev:expectFreshDropiLogin";

export type DropiPanelSessionPrefsV1 = {
  v: 1;
  dateFrom: string;
  dateTo: string;
  region: string;
  product: string;
  carrier: string;
  metaInput: string;
  chartPeriodDays: 1 | 7 | 14 | 30;
  /** Oculta el bloque grande de importación hasta expandir o nueva sesión. */
  importCardCollapsed: boolean;
};

function storageKey(userId: string): string {
  return STORAGE_KEY_PREFIX + userId;
}

export function readDropiSessionPrefs(userId: string): DropiPanelSessionPrefsV1 | null {
  try {
    const raw = sessionStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const p = JSON.parse(raw) as DropiPanelSessionPrefsV1;
    if (p?.v !== 1 || typeof p.dateFrom !== "string" || typeof p.dateTo !== "string") return null;
    if (p.dateFrom > p.dateTo) return null;
    return p;
  } catch {
    return null;
  }
}

export function writeDropiSessionPrefs(userId: string, prefs: DropiPanelSessionPrefsV1): void {
  try {
    sessionStorage.setItem(storageKey(userId), JSON.stringify(prefs));
  } catch {
    // noop (modo privado / cuota)
  }
}

export function clearDropiSessionPrefs(userId: string): void {
  try {
    sessionStorage.removeItem(storageKey(userId));
  } catch {
    // noop
  }
}

export function markExpectFreshDropiLogin(): void {
  try {
    sessionStorage.setItem(DROP_EXPECT_FRESH_LOGIN_KEY, "1");
  } catch {
    /* noop */
  }
}

/** Devuelve true una sola vez si había marca de login fresco. */
export function consumeExpectFreshDropiLogin(): boolean {
  try {
    if (sessionStorage.getItem(DROP_EXPECT_FRESH_LOGIN_KEY) !== "1") return false;
    sessionStorage.removeItem(DROP_EXPECT_FRESH_LOGIN_KEY);
    return true;
  } catch {
    return false;
  }
}

export function clearExpectFreshDropiLoginMarker(): void {
  try {
    sessionStorage.removeItem(DROP_EXPECT_FRESH_LOGIN_KEY);
  } catch {
    /* noop */
  }
}

function activeImportKey(userId: string): string {
  return ACTIVE_IMPORT_KEY_PREFIX + userId;
}

/** Lee el `dropi_order_imports.id` que el usuario está viendo actualmente en el panel. */
export function readDropiActiveImportId(userId: string): string | null {
  if (!userId) return null;
  try {
    return localStorage.getItem(activeImportKey(userId));
  } catch {
    return null;
  }
}

export function writeDropiActiveImportId(userId: string, importId: string): void {
  if (!userId) return;
  try {
    localStorage.setItem(activeImportKey(userId), importId);
  } catch {
    /* noop */
  }
}

/** Limpia el "import activo" sin tocar la DB: las filas y el historial siguen disponibles. */
export function clearDropiActiveImportId(userId: string): void {
  if (!userId) return;
  try {
    localStorage.removeItem(activeImportKey(userId));
  } catch {
    /* noop */
  }
}
