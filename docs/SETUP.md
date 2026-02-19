# Configuración del proyecto

## 1. Variables de entorno

Copia el ejemplo y edita con tus valores:

```bash
cp .env.example .env
```

Revisa `.env.example` para la lista de variables. Mínimo para desarrollo:

- **Supabase (obligatorio):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — el cliente usa estas variables; en producción (p. ej. nomadev.io) configúralas en tu plataforma de deploy (Vercel, Netlify, etc.).
- **Shopify:** solo si usas integración Shopify
- **WhatsApp:** próximamente API oficial de Meta

## 2. Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En Settings → API copia URL y anon key a `.env`.
3. Aplica migraciones: `npx supabase db push` (o desde el dashboard).
4. **Authentication > URL Configuration** (importante para que el login no dé timeout):
   - Abre el **mismo proyecto** que usa esta app (la URL de tu `.env`: `https://xxxx.supabase.co`).
   - **Site URL**: la URL donde corre la app (ej. `http://localhost:5173` en desarrollo o `https://tudominio.com` en producción).
   - **Redirect URLs**: añade la misma URL y, si usas varios orígenes, cada uno (ej. `http://localhost:5173/**`, `https://tudominio.com/**`).
   - Si el proyecto está **pausado** (plan free), la primera petición puede tardar 30+ segundos en “despertar”; el login espera hasta 25 s.

## 3. Desarrollo

```bash
npm install
npm run dev
```

Opcional: para desarrollo con túnel (ngrok), usa el script `start-nomade.bat` (Windows) o configura ngrok manualmente.

## Referencias

- [Integración frontend](frontend-integration.md)
