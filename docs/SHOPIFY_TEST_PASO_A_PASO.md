# Paso a paso: configurar y testear la conexión Shopify

Todo lo que **tú** tienes que configurar para probar el flujo "Conectar Tienda".

---

## 1. Base de datos

En la raíz del proyecto:

```bash
npx supabase db push
```

Con eso se crean las tablas `shopify_oauth_states` y `shopify_connections` (y el resto necesarias para OAuth).

---

## 2. App en Shopify Partners

1. Entra en **https://partners.shopify.com** e inicia sesión.
2. Ve a **Apps** → **Create app** → **Create app manually** (o usa una app existente).
3. Abre la app → pestaña **Configuration** (o **App setup**).
4. En **Client credentials** copia:
   - **Client ID**
   - **Client secret** (clic en "Show" si está oculto).
5. En **Allowed redirection URL(s)** agrega **una** línea (sustituye `TU_PROJECT_REF` por el ID de tu proyecto Supabase):

   ```
   https://TU_PROJECT_REF.supabase.co/functions/v1/shopify-oauth-callback
   ```

   El `TU_PROJECT_REF` lo ves en la URL del dashboard de Supabase:  
   `https://app.supabase.com/project/TU_PROJECT_REF`.

6. Guarda los cambios en Shopify.

---

## 3. Secrets en Supabase (Edge Functions)

1. Entra en **Supabase** → tu proyecto → **Project Settings** (icono engranaje) → **Edge Functions**.
2. En **Secrets** (o "Function secrets") agrega:

   | Name                 | Value                          |
   |----------------------|--------------------------------|
   | `SHOPIFY_API_KEY`    | El **Client ID** de Shopify   |
   | `SHOPIFY_API_SECRET` | El **Client secret** de Shopify |
   | `FRONTEND_URL`       | `http://localhost:5173` (para test local) |

   Si pruebas con el front en producción, pon ahí la URL de tu app (ej: `https://nomadev-io.vercel.app`).

3. Guarda. No hace falta reiniciar nada; las funciones leen los secrets en la siguiente invocación.

---

## 4. Cómo probar en local

1. **Frontend**

   ```bash
   npm run dev
   ```

   Debe estar en `http://localhost:5173` (o la URL que hayas puesto en `FRONTEND_URL`).

2. **Edge Functions**  
   Si usas el proyecto remoto de Supabase, las funciones ya están desplegadas y no necesitas correrlas en local.  
   Si quieres ejecutarlas en local:

   ```bash
   npx supabase functions serve
   ```

   En ese caso la URL de callback que usa Shopify debe ser la de tu proyecto **remoto** (la de Supabase), no localhost, porque Shopify no puede llamar a tu máquina.

3. **Probar el flujo**
   - Abre **http://localhost:5173**.
   - Inicia sesión en Nomadev.
   - Ve a **Configuración** (Settings).
   - En **Integraciones del sistema**, en "Shopify Integration", pulsa **Conectar Tienda**.
   - Te lleva a la página de conectar: escribe **solo el nombre** de tu tienda (ej: `mi-tienda`, sin `.myshopify.com`).
   - Pulsa **Conectar Tienda**.
   - Te redirige a Shopify: inicia sesión si hace falta y **autoriza/instala** la app.
   - Te devuelve a Nomadev (`/auth/success` y luego al dashboard de Shopify).
   - Vuelve a **Configuración**: Shopify Integration debería aparecer como **Conectado**.

---

## Resumen rápido

| Dónde              | Qué hacer |
|--------------------|-----------|
| Terminal           | `npx supabase db push` |
| Shopify Partners   | Crear app, copiar Client ID y Client secret, poner en "Allowed redirection URL(s)" la URL del callback de Supabase |
| Supabase → Secrets | `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `FRONTEND_URL` |
| Navegador          | Login → Configuración → Conectar Tienda → dominio → autorizar en Shopify |

Si algo falla, revisa que la URL de redirect en Shopify sea **exactamente** la de Supabase (con `https`, sin barra final) y que los tres secrets estén bien escritos en Supabase.
