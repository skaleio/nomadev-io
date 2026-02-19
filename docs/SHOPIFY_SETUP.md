# Configuración de Shopify en Nomadev

Guía paso a paso para dejar operativa la conexión de tiendas Shopify (OAuth) y que los usuarios puedan pulsar **Conectar Tienda** y completar el flujo.

---

## Paso 1: Aplicar la migración (DB)

Las tablas necesarias para OAuth están en la migración `20250219000000_restore_shopify_tables.sql`.

```bash
# En la raíz del proyecto
npx supabase db push
```

O, si usas Supabase remoto: aplica las migraciones desde el dashboard (SQL Editor o migraciones) o con `supabase db push` apuntando a tu proyecto.

Comprueba que existan las tablas:

- `shopify_oauth_states`
- `shopify_connections`
- `shopify_activity_log`
- `shopify_webhooks`

---

## Paso 2: Variables de entorno (Supabase)

En **Supabase → Project Settings → Edge Functions → Secrets** (o en `.env` local para `supabase functions serve`), configura:

| Variable | Descripción |
|----------|-------------|
| `SHOPIFY_API_KEY` | Client ID de tu app en Shopify Partners |
| `SHOPIFY_API_SECRET` | Client secret de la app |
| `SHOPIFY_REDIRECT_URI` | (Opcional) Si no se define, se usa `SUPABASE_URL/functions/v1/shopify-oauth-callback` |
| `FRONTEND_URL` | URL del frontend (ej: `https://nomadev-io.vercel.app` o `http://localhost:5173`) para redirigir después del OAuth |

**Nota:** La Edge Function `shopify-oauth-start` usa `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET`. Si en otra parte del código se usan `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET`, puedes definir ambos o unificar nombres según tu código.

---

## Paso 3: Crear la app en Shopify Partners

1. Entra en [Shopify Partners](https://partners.shopify.com) y crea una app (o usa una existente).
2. En la app → **Configuration** → **App setup**:
   - **Allowed redirection URL(s):**  
     `https://<TU_PROJECT_REF>.supabase.co/functions/v1/shopify-oauth-callback`  
     (en local con `supabase functions serve` puedes usar ngrok y poner esa URL aquí).
3. Guarda el **Client ID** y el **Client secret** y úsalos en el Paso 2.

---

## Paso 4: Probar el flujo

1. Arranca el frontend y, si usas Edge Functions en local, `supabase functions serve`.
2. Inicia sesión en Nomadev.
3. Ve a **Configuración** (o **Settings**) y en **Integraciones del sistema** pulsa **Conectar Tienda** en Shopify Integration. Deberías ir a `/shopify/connect`.
4. En **Conectar Tienda Shopify**:
   - Escribe el dominio de la tienda (solo el nombre, ej: `mi-tienda`).
   - Pulsa **Conectar Tienda**.
5. Serás redirigido a Shopify. Inicia sesión si hace falta y **autoriza** la app.
6. Shopify te redirige a la Edge Function y esta te manda al frontend en `/auth/success?shop=...&connected=true`. Desde ahí la app te lleva al dashboard de Shopify en Nomadev.
7. Vuelve a **Configuración**: el estado de **Shopify Integration** debería mostrarse como **Conectado**.

---

## Guía rápida para el usuario final

Puedes dar esto a quien use la plataforma:

1. Entra en **Configuración** y en **Integraciones del sistema** haz clic en **Conectar Tienda** (Shopify).
2. En la pantalla **Conectar Tienda Shopify**, escribe solo el **nombre de tu tienda** (por ejemplo `mi-tienda`, sin `.myshopify.com`).
3. Haz clic en **Conectar Tienda**.
4. En la página de Shopify, inicia sesión si te lo piden y pulsa **Instalar** o **Autorizar** para dar acceso a Nomadev.
5. Serás redirigido de vuelta a Nomadev; cuando veas “Conexión exitosa”, tu tienda ya está conectada. En Configuración verás **Conectado** en Shopify Integration.

---

## Solución de problemas

- **“Configuración de Shopify no encontrada”**: Revisa que `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET` estén definidos en los secrets de la Edge Function.
- **“Error de estado” / “Estado de autorización no es válido”**: La tabla `shopify_oauth_states` debe existir y tener `expires_at` en el futuro. Asegúrate de haber aplicado la migración del Paso 1.
- **Redirect URI no coincide**: La URL en Shopify Partners debe ser exactamente la misma que usa la Edge Function (incluyendo `https` y la ruta `/functions/v1/shopify-oauth-callback`).
- **Después de autorizar no vuelve a la app**: Comprueba `FRONTEND_URL`; debe ser la URL donde corre tu frontend (sin barra final).

---

## Próximos pasos (después de la conexión)

- Ver **pedidos** en la app: ver plan en `docs/SHOPIFY_PLAN.md` (Edge Function `shopify-orders` y conectar OrdersPage).
- Opcional: sincronizar pedidos/productos en BD con webhooks (Fase 2 del plan).
