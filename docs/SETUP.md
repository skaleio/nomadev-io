# Configuración del proyecto

## 1. Variables de entorno

Copia el ejemplo y edita con tus valores:

```bash
cp .env.example .env
```

Revisa `.env.example` para la lista de variables. Mínimo para desarrollo:

- **Supabase (obligatorio):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — el cliente usa estas variables; en producción (p. ej. nomadev.io) configúralas en tu plataforma de deploy (Vercel, Netlify, etc.).
- **Evolution API (WhatsApp):** `VITE_EVOLUTION_API_URL`, `VITE_EVOLUTION_INSTANCE` (ver [evolution-api-setup.md](./evolution-api-setup.md))
- **Shopify:** solo si usas integración Shopify

## 2. Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En Settings → API copia URL y anon key a `.env`.
3. Aplica migraciones: `npx supabase db push` (o desde el dashboard).

## 3. Desarrollo

```bash
npm install
npm run dev
```

Opcional: para desarrollo con túnel (ngrok), usa el script `start-nomade.bat` (Windows) o configura ngrok manualmente.

## Referencias

- [Evolution API / WhatsApp](evolution-api-setup.md)
- [Integración frontend](frontend-integration.md)
