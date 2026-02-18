# Configuración de Dropi en NOMADEV – Paso a paso

Sigue estos pasos para dejar la integración con Dropi funcionando en tu proyecto.

---

## 1. Variables de entorno (opcional)

La Edge Function `dropi-login` usa por defecto el `white_brand_id` de la documentación de Dropi. Solo necesitas configurar algo si Dropi te da otro valor.

- En **Supabase** → **Project Settings** → **Edge Functions** → **Secrets**, puedes añadir:
  - `DROPI_WHITE_BRAND_ID` = el valor que te indique Dropi (si es distinto al por defecto).

En el `.env` del frontend no hace falta nada específico para Dropi (ya usas `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`).

---

## 2. Desplegar las Edge Functions de Dropi

Tienes que desplegar las dos funciones en tu proyecto de Supabase.

Desde la raíz del proyecto (donde está `supabase/functions/`):

```bash
# Si usas Supabase CLI y ya tienes link al proyecto
npx supabase functions deploy dropi-login
npx supabase functions deploy dropi-api
```

O desde el **Dashboard de Supabase** → **Edge Functions** → **Deploy** y subir el código de:

- `supabase/functions/dropi-login/`
- `supabase/functions/dropi-api/`

Asegúrate de que ambas funciones tengan asignadas las variables que usan (por ejemplo `SUPABASE_URL` y `SUPABASE_ANON_KEY` suelen inyectarse solas).

---

## 3. Base de datos (tabla de configuración)

La integración guarda la conexión en la tabla **`user_external_configs`** (misma que Shopify en tu esquema).

- Si ya tienes esa tabla (por ejemplo por la migración `20241220_create_auto_infrastructure.sql`), no tienes que hacer nada.
- Si el proyecto es nuevo y esa tabla no existe, ejecuta la migración que la crea o créala con:

  - `user_id` (UUID, FK a `auth.users`)
  - `service_name` (TEXT), p. ej. `'dropi'`
  - `config_data` (JSONB), p. ej. `{ "email", "token", "baseUrl" }`
  - `is_active` (boolean)
  - Restricción única `(user_id, service_name)`

Y las políticas RLS que permitan a cada usuario leer/actualizar solo sus filas.

---

## 4. En la aplicación: conectar Dropi

1. Inicia la app (por ejemplo `npm run dev`).
2. Inicia sesión con tu usuario de NOMADEV.
3. En el menú lateral, entra en **Dropi**.
4. Si aún no está conectado, pulsa **Conectar Dropi** (te lleva a `/dropi/connect`).
5. En la pantalla de conexión:
   - **Email:** el de tu cuenta Dropi.
   - **Contraseña:** la de tu cuenta Dropi.
   - **Usar entorno de pruebas:** márcalo solo si quieres usar `test-api.dropi.co` en lugar de producción.
6. Pulsa **Conectar Dropi**.
7. Si el login en Dropi es correcto, se guardará el token y se te redirigirá a la página **Dropi** (`/dropi`).

A partir de ahí, en la página Dropi deberías ver:

- **Categorías** (desde Dropi).
- **Productos** (desde Dropi).

Y desde código puedes usar el servicio `dropi` (órdenes, transportadoras, historial de cartera, etc.) como en `docs/dropi-api-integration.md`.

---

## 5. Si la sesión de Dropi expira

Cuando el token de Dropi caduca, la API devuelve **401** y en la app puede aparecer un mensaje de “Sesión expirada” o “Reconecta Dropi”.

Qué hacer:

1. Ve de nuevo a **Dropi** → **Conectar Dropi** (o directamente a `/dropi/connect`).
2. Vuelve a introducir **email** y **contraseña** de Dropi.
3. Pulsa **Conectar Dropi**.

Se hará un nuevo login y se guardará el nuevo token. No hace falta borrar nada a mano.

---

## 6. Resumen de archivos tocados

- **Backend (Edge Functions):**
  - `supabase/functions/dropi-login/index.ts` – Login en Dropi y devolución de token.
  - `supabase/functions/dropi-api/index.ts` – Proxy autenticado a la API de Dropi (categorías, productos, órdenes, etc.).

- **Frontend:**
  - `src/lib/dropi-service.ts` – Login, guardar config, llamadas a `dropi-api` y helpers (`dropi.categories()`, `dropi.products()`, etc.).
  - `src/hooks/useDropiConnection.ts` – Estado de “conectado / no conectado” a Dropi.
  - `src/pages/DropiPage.tsx` – Página principal Dropi (estado de conexión, categorías, productos).
  - `src/pages/DropiConnectPage.tsx` – Formulario para conectar/reconectar Dropi.

- **Rutas:** `/dropi` y `/dropi/connect` (protegidas).
- **Menú:** entrada **Dropi** en el sidebar (layout del dashboard).
- **Documentación:** `docs/dropi-api-integration.md` (referencia de la API) y este archivo (`docs/DROPI_SETUP.md`).

Con esto tienes todo lo necesario para usar los datos de Dropi (productos, categorías, órdenes, guías, etc.) desde NOMADEV. Si quieres ampliar la página Dropi con más acciones (órdenes, cotizador, etc.), puedes reutilizar los mismos helpers de `src/lib/dropi-service.ts` y la Edge Function `dropi-api` ya preparada.
