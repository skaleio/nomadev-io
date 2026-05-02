# ANÁLISIS DEL CODEBASE — nomadev-io

> Auditoría estructural inicial. Generada en `main` @ commit `6b23a85`.
> Total de archivos fuente en `src/`: **216** · LOC totales en `src/`: **~51.028**.
>
> **ESTADO ACTUAL (2026-04-29): Reorganización completada. Ver sección 8 al final.**

---

## 1. STACK DETECTADO

### Lenguaje y framework
- **TypeScript 5.8** + **React 19** (Vite 5 + plugin SWC)
- **Tailwind 3.4** + `tailwindcss-animate` + `@tailwindcss/typography`
- **shadcn/ui** (`components.json` presente) + **HeroUI 2.8** + **Radix UI** (todas las primitives)
- **React Router DOM 6.30**, **TanStack Query 5.83**, **react-hook-form 7.61**, **Zod 3.25**
- **Supabase JS 2.57** (auth + DB + Edge Functions Deno) — único backend canónico
- 3D / motion: `three`, `@react-three/fiber`, `ogl`, `framer-motion`, `motion`, `embla-carousel-react`, `swiper`, `sonner`, `vaul`, `cobe`
- Otros: `socket.io-client`, `recharts`, `xlsx`, `date-fns`, `lucide-react`

### Gestor de paquetes y runtime
- `bun.lockb` y `package-lock.json` conviven → ambigüedad sobre cuál es la fuente de verdad
- README documenta `npm`. Bun-lock probablemente residual del scaffold de Lovable
- Node 18+ requerido (devDep `@types/node ^22.16.5`)
- Ejecución: `npm run dev` (Vite, puerto 5173), `npm run build`, `npm run preview`, `npm run lint`

### Backends/integraciones
- **Supabase Edge Functions**: 22 funciones en `supabase/functions/` (Shopify, Dropi/Easydrop, WhatsApp, n8n, IA, etc.)
- **`shopify-backend/`**: proyecto Node separado en raíz — contiene SOLO `package.json` y `package-lock.json` (sin código fuente). Stub o legacy.
- **`external/shopify-scaffolds/test0/` y `test1/`**: scaffolds de Shopify CLI (toml + extensions). NO forman parte del build de la SPA.
- `scripts/`: helpers ngrok para túnel de desarrollo (3 archivos).

---

## 2. ESTRUCTURA ACTUAL

### Árbol (3 niveles, archivos relevantes)

```
nomadev-io/
├── src/                                216 archivos · ~51 kLOC
│   ├── App.tsx                         (169 líneas, 51 imports de páginas)
│   ├── main.tsx
│   ├── index.css, App.css
│   ├── components/                     ~95 archivos
│   │   ├── ProtectedRoute.tsx
│   │   ├── DebugAuth.tsx               [DEAD]
│   │   ├── EmailVerificationModal.tsx  [DEAD]
│   │   ├── NotificationsPanel.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── RippleGrid.jsx              [.jsx en proyecto TS]
│   │   ├── RippleGrid.css
│   │   ├── Silk.tsx                    [DEAD]
│   │   ├── animate-ui/components/{animate,radix}/   (cursor, sidebar)
│   │   ├── animate-ui/primitives/{animate,radix}/   (slot, checkbox, cursor)
│   │   ├── chat/                       (1) WhatsAppChat
│   │   ├── dashboard/                  (6) DashboardHeader, DashboardLayout (shim), MetricCard, NewDashboardLayout, Sidebar, StatusBadge
│   │   ├── onboarding/                 (1) OnboardingWizard
│   │   ├── orders/                     (1) DropiOrdersPanel  ← 1837 LOC
│   │   ├── settings/                   (1) EnvVarsSetupModal
│   │   ├── shopify/                    (1) ShopifyConnect
│   │   ├── ui/                         62 archivos shadcn + 4 ad-hoc
│   │   └── workflow/                   (6) Connection*, WorkflowCanvas/Node/Example + README.md
│   ├── config/                         performance.ts
│   ├── contexts/                       (5) Auth, SimpleAuth [DEAD], Notifications, Theme, WebSocket
│   ├── examples/                       (1) NotificationExample.tsx     [carpeta huérfana, contenido DEAD]
│   ├── hooks/                          (19) mezcla naming kebab/camel
│   ├── integrations/supabase/          client.ts + types.ts (817 LOC autogen)
│   ├── lib/                            31 archivos PLANOS — el mayor foco de desorden
│   │   ├── security/                   (5) input-validator, mfa, rate-limiter, security-headers, security-monitor
│   │   └── services/                   (6) agent, ai, conversation, lead, whatsapp, workflow
│   ├── pages/                          50 páginas (incluye 13 demos + 1 página fuera de routing)
│   ├── stores/                         connectionStore.ts (Zustand para workflow)
│   └── types/                          workflow.ts (único tipo central)
├── supabase/
│   ├── functions/                      22 edge functions Deno (con duplicados sospechosos)
│   └── migrations/
├── docs/                               7 .md + 1 .html
├── scripts/                            3 helpers ngrok
├── shopify-backend/                    [stub: solo package.json]
├── external/shopify-scaffolds/test0/, test1/  [Shopify CLI scaffolds, no SPA]
├── public/, dist/                      assets / build output
└── archivos raíz: 12+ .ps1/.bat/.sh/.toml/.json
```

### Conteo por carpeta (archivos `.ts/.tsx/.jsx`)

| Carpeta                       | Archivos | Notas                                     |
|-------------------------------|---------:|-------------------------------------------|
| `src/pages/`                  |       50 | 37 productivas + 13 demo                  |
| `src/components/ui/`          |       62 | shadcn estándar + 4 piezas no-shadcn      |
| `src/components/` (resto)     |       33 | feature components + 6 huérfanos en raíz  |
| `src/lib/`                    |       31 | plano, mezcla concerns                    |
| `src/hooks/`                  |       19 | naming inconsistente                      |
| `src/contexts/`               |        5 | 1 dead                                    |
| `supabase/functions/`         |       22 | varios duplicados                         |

---

## 3. INVENTARIO DE PROBLEMAS

### a) Funciones / componentes duplicados

| # | Versión "buena"                               | Duplicado / shim                                            | Veredicto                                                        |
|---|-----------------------------------------------|-------------------------------------------------------------|------------------------------------------------------------------|
| 1 | `src/contexts/AuthContext.tsx`                | `src/contexts/SimpleAuthContext.tsx`                         | SimpleAuth está sin imports — **dead**, borrar tras consolidar.  |
| 2 | `src/components/dashboard/NewDashboardLayout.tsx` (canónico, 573 LOC) | `src/components/dashboard/DashboardLayout.tsx` (8 líneas, solo `return <NewDashboardLayout>`) | El "shim" es lo que **todas** las páginas importan. La pieza real se llama "New", lo cual es engañoso. Renombrar `NewDashboardLayout → DashboardLayout` y eliminar shim. |
| 3 | `src/hooks/use-toast.ts` (lógica real)        | `src/components/ui/use-toast.ts` (re-export)                | El re-export se importa solo desde `toaster.tsx`. Migrar a la canónica y borrar shim. |
| 4 | `src/components/ui/sonner.tsx`                | `src/components/ui/toast.tsx` + `toaster.tsx`               | Conviven Sonner (Radix-toast wrapper) y el sistema toast shadcn — ambos montados en `App.tsx`. Decidir uno. |
| 5 | `src/components/ui/notification-banner.tsx` + `simple-notification.tsx` + `consolidated-notification.tsx` | — | 3 componentes "notification" en `ui/`. Auditar cuál se usa en runtime y consolidar. |
| 6 | `src/components/ui/use-toast.ts` (`.ts` shim) | `src/hooks/use-toast.ts`                                    | Igual a #3 — ya cubierto. |

### b) Múltiples implementaciones del mismo concepto

#### b.1 Cliente HTTP / API — **3 estilos coexistiendo**
| Archivo                            | Estado   | Detalle |
|------------------------------------|----------|---------|
| `src/lib/api.ts`                   | DEAD     | Wrapper de Supabase Edge Functions. Único import vivía en `App.tsx` (línea 15) y está comentado: `// import { setupApiInterceptors } ... // Removed - no longer needed`. |
| `src/lib/backend-api.ts`           | LEGACY   | Apunta a `localhost:3001` (`VITE_BACKEND_URL`). Único consumidor: `src/hooks/useShopifyData.ts`. Implica que existe (o existió) un Node separado distinto a `shopify-backend/`. Hay que verificar si todavía corre. |
| `src/lib/services/*` (6 archivos)  | CANÓNICO | `agent-service`, `ai-service`, `conversation-service`, `lead-service`, `whatsapp-service`, `workflow-service`. Llaman a Supabase directo. **Esta es la capa correcta.** |

#### b.2 Integración Shopify — **8 archivos solapados en `src/lib/`**
| Archivo                          | LOC | Estado | Comentario |
|----------------------------------|----:|--------|-----------|
| `shopify-api.ts`                 | 425 | DEAD   | Cero imports en `src/`. Define tipos REST + métodos contra Storefront API. |
| `shopify-simple.ts`              |  ~  | DEAD   | Cero imports. Header del archivo se autodescribe como "versión simplificada". |
| `ShopifyAPIClient.ts`            | ~270| DEAD/INTERNAL | La clase y `getShopifyClient()` solo se referencian a sí mismas. |
| `ShopifyMetricsService.ts`       | 311 | DEAD/INTERNAL | Clase solo referenciada en sí misma. |
| `shopify-config.ts`              |  ~  | DEAD   | Solo importado por `shopify-api.ts` (también dead). |
| `shopifyMetrics.ts`              |  ~  | VIVO   | Exporta formatters (`formatCurrency`, `formatPercentage`, `formatDate`). Usado por `ShopifyPage`. |
| `connectShopifyManually.ts`      |  ~  | STUB   | Definido como `Promise<never>` — la función arroja. Aún se llama desde `ShopifyPage.tsx` (UX rota). |
| `testShopifyDirect.ts`           |  ~  | DEBUG  | Botón de debug en `ShopifyPage`. Probablemente para devs. |

> **Resultado**: del flujo Shopify productivo solo viven `shopifyMetrics.ts` (formatters) + `useShopifyData` (consume `backend-api.ts` localhost) + `useShopifyConnection`/`useShopifyMetricsSimple` (consumen edge functions) + `components/shopify/ShopifyConnect.tsx` + páginas Shopify. Hay **~1.500 LOC muertas** en `lib/` solo en el dominio Shopify.

#### b.3 Integración Dropi — 6 archivos en `src/lib/`
| Archivo                       | Función                                              |
|-------------------------------|------------------------------------------------------|
| `dropi-service.ts`            | Login + `dropi`/`dropiApi` (canónico, vivo)          |
| `dropiImport.ts`              | Parser xlsx → `toSupabaseInsertRows`                 |
| `easydrop-api.ts` (408 LOC)   | Cliente alterno a edge function `easydrop-integration`. Verificar si solapa con `dropi-service.ts`. |
| `computeDropiMetrics.ts` (559 LOC) | Calculadora de métricas pura                   |
| `dropiSessionPrefs.ts`        | Persistencia de filtros UI por sesión                |
| `resetDropiImportedData.ts`   | Limpieza al logout                                   |

> Todos parecen vivos pero están planos al lado de archivos no-Dropi. Falta carpeta dedicada.

#### b.4 Edge functions con sufijos sospechosos en `supabase/functions/`
| Grupo                           | Variantes                                                                  | Comentario              |
|---------------------------------|----------------------------------------------------------------------------|-------------------------|
| Shopify OAuth                   | `shopify-oauth-init`, `shopify-oauth-start`, `shopify-oauth-callback`      | "init" + "start" suenan duplicadas |
| WhatsApp webhook                | `whatsapp-webhook`, `whatsapp-webhook-v2`                                  | v1/v2 conviviendo       |
| Shopify connection              | `shopify-connect`, `shopify-test-connection`, `shopify-validate`           | Verificar solape        |
| Shopify metrics                 | `shopify-analytics`, `shopify-get-metrics`, `shopify-metrics-advanced`     | Verificar solape        |

> Memoria de proyecto consigna: **`batch-message-worker` corre sin JWT** y **Shopify legacy tiene tablas fantasma**. Pendiente verificar antes de tocar.

### c) Archivos en ubicaciones incorrectas

| Archivo                                              | Debería estar en                            | Razón |
|------------------------------------------------------|---------------------------------------------|-------|
| `src/components/RippleGrid.jsx` + `RippleGrid.css`   | `src/components/effects/RippleGrid/`        | Único `.jsx` y único `.css` sueltos en components. |
| `src/components/Silk.tsx`                            | `src/components/effects/`                   | Efecto 3D al root. (Además está dead.) |
| `src/components/DebugAuth.tsx`                       | borrar                                       | Dead. |
| `src/components/EmailVerificationModal.tsx`          | borrar (existe `pages/EmailVerificationPage`)| Dead. |
| `src/components/NotificationsPanel.tsx`              | `src/features/notifications/components/`    | Pegado al root sin carpeta. |
| `src/components/CommandPalette.tsx`                  | `src/features/command-palette/`             | Pegado al root sin carpeta. |
| `src/components/ProtectedRoute.tsx`                  | `src/features/auth/components/` o `src/routes/` | Mezcla routing con components. |
| `src/components/ui/ConfigStatusBanner.tsx`           | `src/features/settings/components/`         | Feature-specific dentro de `ui/` (que debería ser solo design-system). |
| `src/components/ui/loading-logo.tsx`                 | `src/components/branding/` o `src/components/feedback/` | Lo mismo. |
| `src/components/ui/globe.tsx`, `marquee.tsx`, `orbiting-circles.tsx`, `pointer.tsx`, `hero-video-dialog.tsx`, `custom-cursor.tsx` | `src/components/effects/` | Son efectos de marketing/landing, no primitives shadcn. |
| `src/lib/auto-infrastructure.ts`                     | `src/lib/integrations/onboarding/`          | Lógica de bootstrap por usuario. |
| `src/lib/n8n-webhook.ts`                             | `src/lib/integrations/n8n/`                 | Aislado. |
| `src/lib/get-strict-context.tsx` (.tsx en `lib/`)    | `src/lib/react/` o `src/utils/`             | TSX dentro de lib pesa para el bundle. |
| `src/examples/NotificationExample.tsx`               | borrar o mover a `docs/examples/`           | Único archivo de la carpeta. |
| `src/types/workflow.ts`                              | `src/features/workflow/types.ts`            | Tipo único pegado a su feature. |
| `src/integrations/supabase/types.ts` (817 LOC)       | OK aquí (autogen) pero documentar regla     | Autogenerado por `supabase gen types`. |
| `shopify-backend/`                                   | borrar (solo `package.json`)                | Stub vacío. |
| `external/shopify-scaffolds/test0/`, `test1/`         | Documentar uso de Shopify CLI               | No son tests; son scaffolds aparte del build SPA. |

### d) Código muerto

#### d.1 Archivos sin un solo import
| Archivo                                          | LOC  | Verificación                                     |
|--------------------------------------------------|-----:|--------------------------------------------------|
| `src/contexts/SimpleAuthContext.tsx`             | ~157 | Grep "SimpleAuthContext" → cero matches.         |
| `src/lib/shopify-api.ts`                         |  425 | Grep imports `shopify-api` → cero.               |
| `src/lib/shopify-simple.ts`                      |    ~ | Grep `shopify-simple` → solo header propio.      |
| `src/lib/shopify-config.ts`                      |    ~ | Solo lo usa `shopify-api.ts` (también dead).     |
| `src/lib/api.ts`                                 |    ~ | Único import en `App.tsx` está comentado.        |
| `src/components/Silk.tsx`                        |   98 | Grep `Silk` → solo self-references.              |
| `src/components/DebugAuth.tsx`                   |   19 | No referenciado.                                  |
| `src/components/EmailVerificationModal.tsx`      |    ~ | No referenciado (la versión usada es la `Page`). |
| `src/pages/SecurityDashboard.tsx`                |  275 | Existe la página pero **NO** está en `<Routes>` de `App.tsx`. |
| `src/pages/WhatsAppChatPage.tsx`                 |    ~ | NO está en `<Routes>`. App.tsx usa `ChatPage` y `WhatsAppIntegrationPage`. |
| `src/examples/NotificationExample.tsx`           |    ~ | Único archivo de la carpeta, no importado.       |

> **Posibles dead** (necesitan confirmación de uso runtime, no solo grep):
> - `src/lib/ShopifyAPIClient.ts` (clase y helper solo se referencian a sí mismos)
> - `src/lib/ShopifyMetricsService.ts` (clase solo se referencia a sí misma)

#### d.2 Imports comentados
- `src/App.tsx:13-15` — `SimpleCommandPalette`, `useSimpleCommandPalette`, `setupApiInterceptors`
- `src/components/dashboard/Sidebar.tsx:28,62` — `useSimpleCommandPalette`

#### d.3 Páginas demo (NO dead — intencionales según memoria)
13 demos en `src/pages/*Demo.tsx` + `DemoPage`, `InteractiveDemo`, `ScheduleDemoPage`. Memoria: "mocks internos de referencia, usuarios reales solo ven CRM y pedidos; pendiente rol de testeo para acceder a demos". Recomendación: agruparlas bajo `src/pages/demo/` y prefijo de ruta `/demo/*`, gateado por feature flag o rol.

### e) Nomenclatura inconsistente

| Categoría     | Convención dominante         | Excepciones                                                                       |
|---------------|------------------------------|-----------------------------------------------------------------------------------|
| Hooks         | `useXxx.ts` (camelCase)      | `use-toast.ts`, `use-mobile.tsx`, `use-controlled-state.tsx` (kebab) — **3 fuera**|
| `lib/*`       | mezcla                       | `shopify-api.ts` (kebab) · `ShopifyMetricsService.ts` (Pascal) · `shopifyMetrics.ts` (camel) · `dropi-service.ts` (kebab) · `dropiImport.ts` (camel). **Sin convención.** |
| `components/ui/` (shadcn)| kebab-case        | `ConfigStatusBanner.tsx` (Pascal) — **1 fuera** |
| `components/<feature>/`  | PascalCase        | OK |
| Pages                    | `XxxPage.tsx` (Pascal+Page) | `Dashboard.tsx`, `NotFound.tsx`, `LandingPage.tsx`(ok), `LoginPage.tsx`(ok), `EmailVerificationPage.tsx`(ok). **2 fuera del sufijo.** |
| Layout                   | "Old" / "New" prefix          | `DashboardLayout` (shim) vs `NewDashboardLayout` (real). El "New" perpetua una migración terminada. |

### f) Archivos gigantes (>300 LOC)

| Archivo                                                         | LOC  | Responsabilidades aparentes                                                          |
|-----------------------------------------------------------------|-----:|--------------------------------------------------------------------------------------|
| `src/components/orders/DropiOrdersPanel.tsx`                    | 1837 | Tabla de órdenes + filtros + import xlsx + métricas regionales/transportadora + viz  |
| `src/pages/LandingPage.tsx`                                     | 1777 | Marketing site completo (hero, features, pricing, testimonials, footer) en un comp.  |
| `src/pages/AgentBuilderPage.tsx`                                | 1284 | Builder visual + lógica de conexiones + persistencia                                 |
| `src/pages/StudioIAPage.tsx`                                    | 1006 | Hub de generadores IA                                                                 |
| `src/pages/InteractiveDemo.tsx`                                 |  932 | Demo                                                                                  |
| `src/pages/AgentHubPage.tsx`                                    |  849 | Listado + filtros + acciones                                                          |
| `src/integrations/supabase/types.ts`                            |  817 | Autogen — aceptable                                                                   |
| `src/components/animate-ui/components/radix/sidebar.tsx`        |  810 | Wrapper sidebar (vendor-like)                                                         |
| `src/pages/ProductImageGeneratorPage.tsx`                       |  763 | Generación + galería + editor                                                         |
| `src/pages/CopywritingPage.tsx`                                 |  753 | Generación + plantillas                                                               |
| `src/pages/LogoGeneratorPage.tsx`                               |  700 | Generación + descarga                                                                 |
| `src/pages/CRMPage.tsx`                                         |  694 | Tabla + drawer + filtros                                                              |
| 13 archivos más entre 400–700 LOC                               |   —  | varios                                                                                |

### g) Imports raros / paths inconsistentes

- **NO** se detectaron `../../../../`. Bien.
- Mezcla `@/...` vs `../components/...` dentro de `src/pages/`. Casos relativos detectados:
  - `pages/ChatPage.tsx`, `pages/OrderValidationPage.tsx`, `pages/TrackingPage.tsx`, `pages/ValidationPage.tsx` usan `../components/dashboard/DashboardLayout`.
  - El resto del proyecto usa `@/components/...`.
- `App.tsx` usa rutas relativas para contexts/components mientras toda la app usa alias.

---

## 4. ESTRUCTURA OBJETIVO PROPUESTA

> Adaptada al stack: SPA Vite + React + Supabase. Mantiene `components/ui/` como design-system shadcn intacto y deja `supabase/functions/` separado. El cambio principal es organizar `src/lib/` y `src/pages/` por dominio.

```
src/
├── app/                         # entrada y composición de la app
│   ├── App.tsx                  # solo provider tree + <AppRouter/>
│   ├── main.tsx
│   ├── router.tsx               # <Routes> y agrupación pública/protegida/demo
│   └── providers.tsx            # Theme, Auth, WS, Notifications, Query, HeroUI
├── features/                    # un dominio por carpeta — UI + hooks + lógica juntos
│   ├── auth/                    # AuthContext, ProtectedRoute, LoginPage, RegisterPage, EmailVerificationPage, AuthSuccessPage, useAuthRedirect
│   ├── onboarding/              # OnboardingPage, OnboardingWizard, useOnboardingRedirect, auto-infrastructure
│   ├── dashboard/               # DashboardLayout (renombrado), Sidebar, Header, MetricCard, StatusBadge, Dashboard.tsx
│   ├── shopify/                 # páginas + ShopifyConnect + hooks + lib (consolidado)
│   ├── dropi/                   # DropiPage, DropiConnectPage, DropiOrdersPanel (refactorizar), hooks, lib
│   ├── orders/                  # OrdersPage, OrderValidationPage, TrackingPage, ValidationPage
│   ├── crm/                     # CRMPage, LeadsPage + hooks
│   ├── chat/                    # ChatPage, WhatsAppChat, useConversations
│   ├── whatsapp/                # WhatsAppIntegrationPage
│   ├── workflow/                # WorkflowCanvas/Node/Connection*, AgentBuilderPage, store, types
│   ├── agents/                  # AgentHubPage, useAgents
│   ├── studio-ia/               # StudioIA, ProductImageGenerator, Copywriting, LogoGenerator, BrandIdentity, PriceOptimizer, WebsiteBuilder
│   ├── billing/                 # BillingPage
│   ├── team/                    # TeamIndex, TeamNew, TeamInvite
│   ├── settings/                # SettingsPage, EnvVarsSetupModal, ConfigStatusBanner
│   ├── profile/                 # ProfilePage
│   ├── notifications/           # NotificationsPanel, NotificationsContext, useNotifications, banner/simple/consolidated unificados
│   └── command-palette/         # CommandPalette, useCommandPalette
├── pages/                       # solo "shell" pages que no entran en ninguna feature
│   ├── LandingPage.tsx          # candidato a partir en secciones
│   ├── NotFound.tsx
│   ├── KeyboardShortcutsPage.tsx
│   └── demo/                    # las 13 demos juntas, gateadas por flag/rol
├── shared/                      # transversal usado por 2+ features
│   ├── components/
│   │   ├── ui/                  # shadcn intacto (62 archivos)
│   │   ├── effects/             # Globe, RippleGrid, Silk, Marquee, OrbitingCircles, Pointer, HeroVideoDialog, CustomCursor
│   │   ├── feedback/            # LoadingLogo, Toaster, Sonner
│   │   └── animate-ui/          # vendor-like, queda como está
│   ├── hooks/                   # use-mobile, use-controlled-state, useDocumentTitle, usePerformance
│   ├── lib/
│   │   ├── supabase/            # client + types (mover de integrations/)
│   │   ├── env.ts               # consolidado de env-config + env-persistence + useEnvConfig
│   │   ├── error-handler.ts
│   │   ├── utils.ts             # cn(), date helpers, etc.
│   │   ├── react/               # get-strict-context, etc.
│   │   └── security/            # input-validator, mfa, rate-limiter, security-headers, security-monitor (queda)
│   ├── types/                   # globals
│   └── theme/                   # ThemeContext, regionChartColors, performance config
└── styles/                      # index.css, App.css
```

### Justificación por carpeta principal

| Carpeta       | Razón                                                                                       |
|---------------|---------------------------------------------------------------------------------------------|
| `app/`        | Composición y bootstrap separados de las features.                                          |
| `features/`   | Lo que cambia junto vive junto: UI, hooks y lógica de un dominio en una sola carpeta.       |
| `pages/`      | Solo páginas "globales" que no pertenecen a un dominio (Landing, NotFound, demo agrupadas). |
| `shared/`     | Reglas: si lo usan 2+ features, sube a shared. Si lo usa 1, vive en la feature.             |
| `shared/components/ui/` | Design-system shadcn — no se mezcla con efectos ni feature-specific.              |
| `shared/lib/supabase/`  | Único punto canónico para acceso a Supabase (cliente + types autogen).            |

---

## 5. PLAN DE MIGRACIÓN

> Ordenado por **riesgo creciente**. Cada paso es atómico, reversible, con un solo cambio lógico. No avanza sin verificación + commit independiente.

### Fase A — Limpieza segura (mover/borrar dead code, sin tocar la app viva)

| #  | Paso                                                                                          | Archivos                                                                                                            | Riesgo |
|---:|-----------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------|--------|
| A1 | Eliminar imports comentados                                                                   | `src/App.tsx` (líneas 13-15), `src/components/dashboard/Sidebar.tsx` (líneas 28, 62)                                 | mínimo |
| A2 | Borrar `src/contexts/SimpleAuthContext.tsx`                                                   | 1 archivo                                                                                                            | bajo   |
| A3 | Borrar `src/components/DebugAuth.tsx`                                                         | 1 archivo                                                                                                            | bajo   |
| A4 | Borrar `src/components/EmailVerificationModal.tsx`                                            | 1 archivo                                                                                                            | bajo   |
| A5 | Borrar `src/components/Silk.tsx`                                                              | 1 archivo                                                                                                            | bajo   |
| A6 | Borrar `src/examples/` completo                                                               | 1 carpeta (1 archivo)                                                                                                | bajo   |
| A7 | Borrar `shopify-backend/`                                                                     | stub vacío                                                                                                            | bajo   |
| A8 | Decidir: borrar `src/pages/SecurityDashboard.tsx` o agregar ruta                              | 1 archivo                                                                                                            | bajo (decisión del usuario) |
| A9 | Decidir: borrar `src/pages/WhatsAppChatPage.tsx` o agregar ruta                               | 1 archivo                                                                                                            | bajo (decisión del usuario) |

### Fase B — Consolidación de duplicados (sin renombrar superficies públicas)

| #  | Paso                                                                                          | Acción                                                                                                                | Riesgo |
|---:|-----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|--------|
| B1 | Confirmar que `lib/api.ts` no tiene imports activos y borrarlo                                | Verificar grep + borrar `src/lib/api.ts`                                                                              | bajo |
| B2 | Borrar Shopify dead lib                                                                       | `shopify-api.ts`, `shopify-simple.ts`, `shopify-config.ts`                                                            | bajo |
| B3 | Confirmar dead vs internal en `ShopifyAPIClient.ts`, `ShopifyMetricsService.ts` y borrar      | Si confirmado dead, borrar; si no, mover a `features/shopify/lib/`                                                    | medio (preguntar) |
| B4 | Reemplazar import de `@/components/ui/use-toast` por `@/hooks/use-toast` y borrar el shim     | toaster.tsx + cualquier consumidor                                                                                    | bajo |
| B5 | Renombrar `NewDashboardLayout` → `DashboardLayout` (canonical) y borrar shim re-export        | Cambia shim por export real; actualiza 2 imports directos (`AgentHubPage`, `WhatsAppIntegrationPage`)                 | medio |
| B6 | Decidir Sonner vs Toast shadcn (mantener uno)                                                 | Quitar el otro de `App.tsx`                                                                                           | medio (preguntar) |
| B7 | Auditar y consolidar las 3 notificaciones (`notification-banner`, `simple-notification`, `consolidated-notification`) | Mantener 1, eliminar 2                                                                              | medio (preguntar) |
| B8 | Decidir destino de `lib/backend-api.ts` + `useShopifyData.ts`                                 | ¿Sigue corriendo el backend localhost:3001? Si no, borrar; si sí, documentar.                                          | medio (preguntar) |

### Fase C — Reubicaciones sin renombrar (mover archivos + actualizar imports)

| #  | Paso                                                                                          | Archivos                                                                                                              | Riesgo |
|---:|-----------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|--------|
| C1 | Mover efectos de marketing fuera de `components/ui/`                                          | `globe.tsx`, `marquee.tsx`, `orbiting-circles.tsx`, `pointer.tsx`, `hero-video-dialog.tsx`, `custom-cursor.tsx` → `components/effects/` | bajo |
| C2 | Mover `RippleGrid.jsx` + `RippleGrid.css` a `components/effects/RippleGrid/`                  | 2 archivos + 5 imports                                                                                                | bajo |
| C3 | Mover `loading-logo.tsx` a `components/feedback/`                                             | 1 archivo + actualizar imports                                                                                        | bajo |
| C4 | Mover `ConfigStatusBanner.tsx` a `components/settings/`                                       | 1 archivo + actualizar imports                                                                                        | bajo |
| C5 | Migrar pages a alias `@/`                                                                     | `ChatPage`, `OrderValidationPage`, `TrackingPage`, `ValidationPage` (cambiar `../components/...` → `@/components/...`)| bajo |
| C6 | Mover `RippleGrid.jsx` a `.tsx` (con tipos mínimos) o documentar excepción                    | 1 archivo                                                                                                             | medio (preguntar) |

### Fase D — Reorganización por features (la grande)

> NO ejecutar sin aprobación explícita del usuario. Cada sub-feature es un commit propio.

| #   | Paso                                                                  |
|----:|-----------------------------------------------------------------------|
| D1  | Crear esqueleto `src/app/`, `src/features/`, `src/shared/`            |
| D2  | Migrar `auth` (contexto + páginas + ProtectedRoute + hooks)           |
| D3  | Migrar `dashboard` layout + sidebar + header                          |
| D4  | Migrar `shopify` (páginas + lib + hooks + componentes)                |
| D5  | Migrar `dropi` (páginas + lib + hooks + DropiOrdersPanel sin partir)  |
| D6  | Migrar `orders` / `crm` / `leads` / `chat` / `whatsapp`               |
| D7  | Migrar `workflow` + `agents` + `studio-ia` + `billing` + `team` + `settings` + `profile` |
| D8  | Migrar `notifications` + `command-palette`                            |
| D9  | Mover `integrations/supabase/` → `shared/lib/supabase/`               |
| D10 | Consolidar `env-config.ts` + `env-persistence.ts` + `useEnvConfig.ts` en `shared/lib/env.ts` |
| D11 | Agrupar páginas demo en `pages/demo/` y prefijo `/demo/*`             |
| D12 | Extraer `LandingPage.tsx` en secciones (Hero, Features, Pricing, etc.)|

### Fase E — Renombrados de convención (último, separado por commit)

| #  | Paso                                                                  |
|---:|-----------------------------------------------------------------------|
| E1 | Unificar hooks a `useXxx.ts` (camelCase): `use-toast` → `useToast`, `use-mobile` → `useMobile`, `use-controlled-state` → `useControlledState`. Mantener re-export `@deprecated` 1 ciclo. |
| E2 | Unificar `lib/` interna a kebab-case (`ShopifyMetricsService.ts` → `shopify-metrics-service.ts`, `dropiImport.ts` → `dropi-import.ts`, etc.) |
| E3 | Pages sin sufijo `Page` → agregar (`Dashboard.tsx` → `DashboardPage.tsx`)        |

### Fase F — Edge functions (auditoría aparte, no SPA)

> Requiere aprobación + verificación de tablas + revisión de DNS/webhooks externos.

| #  | Paso                                                                                                                                                  |
|---:|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| F1 | Mapear consumidores de cada función Shopify OAuth (init/start/callback)                                                                               |
| F2 | Decidir: `whatsapp-webhook` vs `whatsapp-webhook-v2` — cuál apunta el provider real                                                                   |
| F3 | Mapear consumidores de `shopify-connect` / `shopify-test-connection` / `shopify-validate`                                                             |
| F4 | Mapear consumidores de `shopify-analytics` / `shopify-get-metrics` / `shopify-metrics-advanced`                                                       |
| F5 | Consolidar / deprecar funciones huérfanas                                                                                                             |

---

## 6. RESUMEN EJECUTIVO — TOP 5 PROBLEMAS

1. **Dominio Shopify es un cementerio de implementaciones**: 8 archivos en `src/lib/*shopify*` con ~1.500 LOC muertas (`shopify-api.ts`, `shopify-simple.ts`, `shopify-config.ts`, `ShopifyAPIClient.ts`, `ShopifyMetricsService.ts`). El flujo productivo solo usa `shopifyMetrics.ts` + edge functions. Esto sumado a las 3+3+ edge functions con sufijos solapados (`oauth-init/start/callback`, `connect/test-connection/validate`, `analytics/get-metrics/metrics-advanced`) hace imposible saber cuál es la verdad.

2. **Capa de API tiene 3 estilos coexistiendo**: `lib/api.ts` (DEAD), `lib/backend-api.ts` (legacy localhost:3001 usado solo por `useShopifyData`), y `lib/services/*` (canónico vía Supabase). Cualquier dev nuevo no sabrá cuál usar. Plus: existe `shopify-backend/` en raíz que es un stub vacío.

3. **`src/lib/` plano con 31 archivos mezclando concerns**: clientes API + persistencia + formateo + integraciones + helpers React + clases dead + utilidades — todo al mismo nivel, sin convención de nombres (`shopify-api.ts` kebab, `ShopifyMetricsService.ts` Pascal, `shopifyMetrics.ts` camel, `dropiImport.ts` camel, `dropi-service.ts` kebab — todos juntos).

4. **`DropiOrdersPanel.tsx` tiene 1837 LOC** (tabla + filtros + import xlsx + métricas regionales/transportadora + visualizaciones), `LandingPage.tsx` tiene 1777 LOC. Junto con otros 9 archivos >700 LOC, son los puntos donde un cambio chico hoy es de alto riesgo.

5. **Naming engañoso de migraciones a medio terminar**: `DashboardLayout.tsx` es un shim de 8 líneas que reexporta a `NewDashboardLayout.tsx` (573 LOC, el real). El "New" perpetúa una migración que ya terminó. Plus `SimpleAuthContext.tsx` (variante vieja, dead) y `SimpleCommandPalette` (referenciado solo en imports comentados) muestran limpiezas inconcluidas.

---

## 7. INTERROGANTES BLOQUEANTES (necesito tu input antes de Fase B/C)

1. **`backend-api.ts` (localhost:3001)**: ¿el backend Node existe todavía? ¿O `useShopifyData` está roto en producción y nadie se enteró porque las páginas Shopify usan otros caminos?
2. **`ShopifyAPIClient.ts` y `ShopifyMetricsService.ts`**: ¿alguno se carga dinámicamente o por reflexión que el grep no detecte? Si no, son ~580 LOC para borrar.
3. **`SecurityDashboard.tsx` y `WhatsAppChatPage.tsx`**: ¿son páginas pendientes de cablear o limpieza pendiente?
4. **Sonner vs Toast shadcn**: ¿se mantienen los dos o se elige uno?
5. **`bun.lockb` + `package-lock.json`**: ¿npm o bun? Borrar el otro.
6. **`shopify-backend/`** (si existiera), **`external/shopify-scaffolds/`**: ¿legacy o se siguen usando para extensiones Shopify?

---

> **STOP** — Fin de Fase 1. No se modificó código. Esperando aprobación para Fase 2 con respuestas a la sección 7.

---

## 8. ESTADO POST-REORGANIZACIÓN (2026-04-29)

Las Fases A-D del plan se ejecutaron. Build Vite ✅, errores TS sin regresión vs baseline (296 → 296).

### 8.1 Estructura final

```
src/
├── App.tsx                       # composición de providers + router
├── main.tsx                      # entrypoint con <ErrorBoundary>
├── App.css, index.css
├── components/                   # design-system + globales
│   ├── ui/                       # shadcn primitives (sin feature-specific)
│   ├── effects/                  # globe, marquee, custom-cursor, RippleGrid, hero-video-dialog
│   ├── feedback/                 # loading-logo
│   ├── animate-ui/               # vendor-like
│   └── ErrorBoundary.tsx
├── config/performance.ts
├── contexts/                     # solo providers globales
│   └── WebSocketContext.tsx
├── features/                     # 18 features, cada una autocontenida
│   ├── agents/{hooks,lib,pages}
│   ├── auth/{components,context,hooks,pages}
│   ├── billing/pages
│   ├── chat/{components,hooks,lib,pages}
│   ├── command-palette/CommandPalette.tsx
│   ├── crm/{hooks,lib,pages}
│   ├── dashboard/{components,pages}
│   ├── dropi/{components,hooks,lib,pages}
│   ├── notifications/{components,context,hooks,lib,ui}
│   ├── onboarding/{components,hooks,lib,pages}
│   ├── orders/pages
│   ├── profile/pages
│   ├── settings/{components,hooks,lib,pages}
│   ├── shopify/{components,hooks,lib,pages}
│   ├── studio-ia/{lib,pages}
│   ├── team/pages
│   ├── whatsapp/{lib,pages}
│   └── workflow/{components,hooks,lib,pages,store,types}
├── hooks/                        # transversales (use-mobile, useDocumentTitle, usePerformance, use-controlled-state, useWebSocket)
├── lib/                          # transversales
│   ├── supabase/{client,types}.ts
│   ├── security/                 # input-validator, mfa, rate-limiter, security-headers, security-monitor
│   ├── react/get-strict-context.tsx
│   ├── services/ai-service.ts    # transversal IA (no específico de feature)
│   ├── utils.ts, config.ts, error-handler.ts, lockedNavPaths.ts, n8n-webhook.ts, regionChartColors.ts
├── pages/                        # solo páginas globales
│   ├── LandingPage.tsx, NotFound.tsx, KeyboardShortcutsPage.tsx
│   └── demo/                     # 13 demos agrupadas
└── theme/ThemeContext.tsx
```

### 8.2 Cambios aplicados

**Limpieza de dead code (pre-existente, sin tocar)**: en commit `108f31c` se borraron archivos no tracked: SimpleAuthContext, Silk, DebugAuth, EmailVerificationModal, examples/, shopify-backend/, lib/api, lib/backend-api, lib/shopify-api, lib/shopify-simple, lib/shopify-config, lib/ShopifyAPIClient, lib/ShopifyMetricsService, hooks/useShopifyData, pages/SecurityDashboard, pages/WhatsAppChatPage, ui/use-toast (shim), ui/pointer, ui/orbiting-circles, ui/ConfigStatusBanner, bun.lockb.

**Edge functions Supabase saneadas** (auditoría con MCP):
- 11 funciones huérfanas en filesystem (sin deploy real) borradas: `api-keys`, `batch-message-worker`, `easydrop-integration`, `n8n-webhook`, `public-api`, `shopify-analytics`, `shopify-connect`, `shopify-oauth-init`, `shopify-validate`, `whatsapp-send`, `whatsapp-webhook` (v1).
- Quedan 13 funciones activas + `_shared` + 4 archivos config — alineado con producción.

**Reorganización por features**: 18 features creadas, cada una con `{components,hooks,lib,pages,context,...}` según necesidad. Todos los imports actualizados con sed masivo (cero residuos viejos verificados con grep).

**Toast system unificado**: Se eliminó `<Toaster>` shadcn de App.tsx (solo Sonner queda montado). Borrados `src/components/ui/toaster.tsx`, `toast.tsx`, `src/hooks/use-toast.ts`. ShopifyPage migrado de `useToast()` a `toast` de Sonner.

**ShopifyPage limpiado**: removidos handlers `handleConnectManually` (helper que arrojaba `Error("tabla shops eliminada")`) y `handleTestDirect` (helper de debug). Borrados `src/lib/connectShopifyManually.ts` y `src/lib/testShopifyDirect.ts`. Los botones nunca se renderizaban — UX recta sin cambios visibles.

### 8.3 Bugs documentados (no rediseñados — son decisiones de producto)

Detectados durante la auditoría con MCP, pero NO corregidos en este refactor (cambios de superficie):

1. **Conexión Shopify rota en producción**:
   - `src/features/shopify/components/ShopifyConnect.tsx:67` invoca `shopify-oauth-init` — esa edge function NO existe en Supabase. La activa es `shopify-oauth-start`.
   - `src/features/shopify/lib/shopifyMetrics.ts:91` invoca `shopify-analytics` — tampoco existe. Las activas son `shopify-get-metrics` y `shopify-metrics-advanced`.
2. **Tablas Shopify legacy**: comentarios in-code referencian tabla `shops` que ya no existe. Las tablas activas son `shopify_connections`, `shopify_oauth_states`, `shopify_activity_log`, `shopify_webhooks`.

### 8.4 Pendientes de futuras fases (decisión del usuario)

1. **3 componentes notification** (`notification-banner`, `simple-notification`, `consolidated-notification`): los 3 viven en `src/features/notifications/ui/` y se importan en `DashboardLayout`. Necesita auditoría runtime para decidir consolidación.
2. **Re-enchufado del flujo Shopify**: invokes a edge functions inexistentes deben actualizarse a las nombres reales en Supabase, o el flujo entero rediseñado.
3. **Archivos gigantes**: `DropiOrdersPanel.tsx` (1837 LOC), `LandingPage.tsx` (1777 LOC), `AgentBuilderPage.tsx` (1284 LOC). Candidatos a partir en sub-componentes.
4. **TS errors pre-existentes**: 296 errores baseline siguen ahí. La mayoría son tipos de Supabase con queries que apuntan a columnas que no existen. Auditar tras el saneo de DB.
5. **`bun.lockb` ya borrado** — npm es ahora el package manager canónico.
6. **`external/shopify-scaffolds/test0/` y `test1/`**: scaffolds Shopify CLI, sin código de SPA. No afectan el build de la SPA; trabajo con `shopify app dev` desde esas carpetas.

