# Plan de acción: Shopify funcional en Nomadev

Objetivo: que **nomadev-io** permita ver pedidos, productos y todo lo relacionado con Shopify de forma estable, para convertir la plataforma en un producto rentable para tu comunidad de ecom.

---

## Estado actual (resumen)

| Área | Estado |
|------|--------|
| **Auth / usuarios** | OK (Supabase, email, Google) |
| **Conexión Shopify** | Parcial: OAuth y “conectar tienda” existen, pero hay desalineación entre BD y frontend |
| **Dónde se guarda la conexión** | OAuth escribe en `shopify_connections`; el frontend lee de `user_external_configs` → no coinciden |
| **Tablas Shopify en BD** | Eliminadas en un cleanup (`shops`, `orders`, `products`, `shopify_oauth_states`, etc.) |
| **OrdersPage** | UI lista; datos en lista vacía + TODO a Supabase |
| **CRM / Leads / Chat** | Referencias a “conectar Shopify”; sin datos reales de pedidos/productos |

Conclusión: la base (auth, UI, OAuth, Edge Functions) está; faltan **esquema unificado**, **origen único de credenciales**, **API de pedidos/productos** y **conectar la UI a datos reales**.

---

## Fase 1 – Conexión y pedidos visibles (MVP)

Objetivo: que un usuario conecte su tienda (OAuth o manual) y vea sus **pedidos** en Nomadev.

### 1.1 Base de datos

- **Restaurar tablas necesarias para OAuth y conexión** (sin restaurar aún `orders`/`products` en BD):
  - `shopify_oauth_states` (para el flujo OAuth init → callback).
  - `shopify_connections` (donde el callback ya escribe).
- Crear una **migración nueva** que:
  - Cree `shopify_oauth_states` y `shopify_connections` (y RLS) si no existen.
  - No dependa de tablas que el cleanup eliminó (ej. no usar `shops`).

### 1.2 Unificar dónde se lee la conexión

- **Opción A (recomendada):** El frontend y las Edge Functions leen **siempre** de `shopify_connections`:
  - Actualizar **useShopifyConnection** para leer de `shopify_connections` (shop_domain, access_token) en lugar de `user_external_configs`.
  - Asegurar que el **callback OAuth** siga escribiendo en `shopify_connections` (ya lo hace).
- **Opción B:** Hacer que el callback escriba **también** en `user_external_configs` (service_name = `shopify`) y dejar que el frontend siga leyendo de ahí. Menos cambios en el frontend, pero dos fuentes de verdad.

Objetivo: **una sola fuente de verdad** para “tienda conectada” (dominio + access_token).

### 1.3 Edge Function: pedidos desde Shopify

- Crear **Edge Function** (ej. `shopify-orders`):
  - Recibe: usuario autenticado (JWT).
  - Obtiene credenciales de la tienda del usuario desde `shopify_connections` (o de `user_external_configs` si se elige Opción B).
  - Llama a **Shopify Admin API** `GET /admin/api/2024-01/orders.json` (con paginación si hace falta).
  - Devuelve JSON de pedidos (mapeado a un formato estable para el frontend).
- Opcional: query params `limit`, `status`, `since_id` para filtrar/paginar.

### 1.4 Frontend: OrdersPage con datos reales

- En **OrdersPage**:
  - Si el usuario **no** tiene Shopify conectado: mostrar CTA “Conectar Shopify” (enlace a ShopifyConnectPage o flujo OAuth).
  - Si **sí** está conectado: llamar a la Edge Function `shopify-orders` y mostrar la lista de pedidos (y métricas derivadas: total, pendientes, etc.).
- Reutilizar la UI actual (tabla, filtros, detalle) y reemplazar la lista vacía por la respuesta de la Edge Function.
- Mapear estados de Shopify (ej. `pending`, `fulfilled`, `cancelled`) a los estados/badges que ya tienes en la página.

Entregable Fase 1: **conectar tienda → ver pedidos reales en Nomadev**.

---

## Fase 2 – Productos y sincronización opcional en BD

Objetivo: ver **productos** y, si quieres, tener copia en Supabase para búsqueda/filtros rápidos.

### 2.1 Edge Function: productos desde Shopify

- Crear **shopify-products** (o extender una función `shopify-api`):
  - Misma lógica que pedidos: auth → credenciales desde `shopify_connections` → `GET /admin/api/2024-01/products.json`.
  - Devolver lista (y opcionalmente paginación).

### 2.2 Página o sección “Productos”

- Nueva página **Productos** (o pestaña en Dashboard) que liste productos de la tienda conectada usando la nueva Edge Function.
- Filtros básicos (por título, estado) en frontend.

### 2.3 (Opcional) Tablas `orders` / `products` en Supabase

- Si quieres **búsqueda rápida y filtros complejos** sin llamar siempre a Shopify:
  - Nueva migración que cree de nuevo tablas `orders` y `products` (y si aplica `customers`) con diseño alineado a **Shopify** (shop_id → shopify_connections o a una tabla `shops` ligada a usuario).
  - **Webhooks** de Shopify (orders/create, orders/updated, products/create, products/update) que llamen a una Edge Function y esta escriba/actualice en Supabase.
  - Configurar en Shopify los webhooks apuntando a tu URL pública (ngrok en dev, dominio en prod).

Entregable Fase 2: **ver productos**; opcionalmente **sincronización en BD y webhooks**.

---

## Fase 3 – CRM, validación y valor para ecom

Objetivo: que pedidos y clientes alimenten **CRM**, **validación de pedidos** y flujos que tu comunidad valore.

### 3.1 CRM con datos reales

- **CRMPage** y **LeadsPage**: que puedan usar datos de pedidos/clientes de Shopify (desde Edge Functions o desde tablas sincronizadas).
  - Ej.: lista de clientes con último pedido, valor total, estado del último pedido.

### 3.2 Validación de pedidos

- Flujo de “validación” de pedidos (antifraude, stock, dirección, etc.):
  - Estados en la UI (pendiente validación → validado / rechazado).
  - Si guardas pedidos en BD, actualizar `validation_status`; si no, al menos reflejar en la UI y opcionalmente llamar a Shopify (ej. notas o tags) vía API.

### 3.3 Chat / WhatsApp y pedidos

- Donde hoy pones “conecta Shopify”: enlazar conversaciones o leads con pedidos (por email/teléfono) usando datos de Shopify para mostrar contexto (último pedido, total, etc.).

Entregable Fase 3: **CRM y validación de pedidos** usando Shopify como fuente de verdad.

---

## Fase 4 – Escalar y monetizar

- **Multi-tienda:** si un usuario puede conectar varias tiendas, modelar `shopify_connections` por (user_id, shop_domain) y un selector de tienda en la app.
- **Límites y planes:** uso de Edge Functions, número de pedidos/productos mostrados, etc., según plan (free / pro).
- **Onboarding:** guía paso a paso “Conecta tu tienda → Ve tus pedidos” para nuevos usuarios.
- **Métricas de uso:** eventos (conexión Shopify, vistas de pedidos, etc.) para entender adopción y mejorar conversión.

---

## Orden sugerido de implementación (próximos pasos)

1. **Migración:** crear `shopify_oauth_states` y `shopify_connections` (y RLS) en una migración nueva que no dependa de tablas eliminadas.
2. **useShopifyConnection:** cambiar a lectura desde `shopify_connections` (y, si se mantiene conexión manual, escribir también en `shopify_connections` o en `user_external_configs` y leer de uno solo).
3. **Edge Function shopify-orders:** implementar y probar con una tienda de desarrollo.
4. **OrdersPage:** conectar a `shopify-orders` y mostrar pedidos reales cuando haya tienda conectada.
5. Documentar en **SETUP.md** (o SHOPIFY_SETUP.md): variables de entorno Shopify (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI), y pasos para conectar una tienda (OAuth + opción manual si la mantienes).

Con esto tendrás la pata de **“ver pedidos y todo lo que tiene que ver con Shopify”** funcional; las fases 2–4 se pueden ir haciendo en sprints según prioridad de tu comunidad.

---

## Variables de entorno necesarias (Shopify)

- `SHOPIFY_CLIENT_ID` o `SHOPIFY_API_KEY`
- `SHOPIFY_CLIENT_SECRET` o `SHOPIFY_API_SECRET`
- `SHOPIFY_REDIRECT_URI` (o construido desde SUPABASE_URL + `/functions/v1/shopify-oauth-callback`)
- En producción: URL pública para webhooks (cuando implementes Fase 2.3).

---

## Referencias en el repo

- **OAuth:** `supabase/functions/shopify-oauth-init`, `shopify-oauth-callback`
- **Conexión en frontend:** `src/hooks/useShopifyConnection.ts`
- **UI pedidos:** `src/pages/OrdersPage.tsx`
- **Conectar tienda:** `src/pages/ShopifyConnectPage.tsx`, `src/components/shopify/ShopifyConnect.tsx`
- **Esquema antiguo (referencia):** `supabase/migrations/old_migrations/20241201000001_create_initial_schema.sql`, `20241201000004_create_shopify_oauth_tables.sql`

Si quieres, el siguiente paso concreto puede ser: **escribir la migración de Fase 1.1** y el **cambio en useShopifyConnection** para leer de `shopify_connections`.
