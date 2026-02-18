# NOMADEV

Plataforma de agentes de IA con integración WhatsApp, CRM, workflows y análisis.

## Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (Auth, DB, Edge Functions)
- **Integraciones:** Evolution API (WhatsApp), Shopify, n8n

## Requisitos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com) y [Lovable](https://lovable.dev) (opcional)

## Inicio rápido

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus claves (Supabase, Evolution API, etc.)

# Desarrollo
npm run dev
```

La app se sirve en `http://localhost:5173`.

## Scripts

| Comando        | Descripción              |
|----------------|--------------------------|
| `npm run dev`  | Servidor de desarrollo   |
| `npm run build`| Build de producción      |
| `npm run preview` | Vista previa del build |
| `npm run lint` | Linter                   |

## Estructura del proyecto

```
src/
├── components/   # Componentes UI y de negocio
├── contexts/     # React contexts (Auth, Theme, WebSocket, etc.)
├── hooks/        # Hooks personalizados
├── integrations/ # Cliente Supabase y tipos
├── lib/          # Utilidades, APIs, servicios
├── pages/        # Páginas y rutas
├── stores/       # Estado global
├── types/        # Tipos TypeScript
└── styles/       # Estilos globales
```

## Documentación

- [Configuración y variables de entorno](docs/SETUP.md)
- [Evolution API (WhatsApp)](docs/evolution-api-setup.md)
- [Integración frontend](docs/frontend-integration.md)

## Variables de entorno

Ver `.env.example` para la lista de variables. Las necesarias para desarrollo mínimo:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` – Supabase
- Opcional: Evolution API, Shopify, n8n (ver docs)

## Licencia

Privado.
