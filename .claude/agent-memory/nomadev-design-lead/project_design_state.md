---
name: Estado del sistema de diseño Nomadev (auditoría 2026-04-25)
description: Snapshot del sistema de diseño tras auditoría completa — tokens, deuda, páginas, componentes
type: project
---

Estado del sistema de diseño tras auditoría completa a 2026-04-25.

**Why:** Auditoría previa a modernización visual 2026. Punto de partida documentado.

**How to apply:** Referencia para priorizar qué arreglar en cada fase del roadmap.

## Tokens (src/index.css + tailwind.config.ts)
- Sistema de tokens HSL completo y limpio. Sin !important patológicos (los únicos son los 4 en prefers-reduced-motion, que son correctos).
- Paleta: background 224 24% 4%, primary 217 91% 60%, neutros cálidos. Correcta.
- line-height: 1.5 en body. Fix ya aplicado.
- Scrollbar: sobria, thin, monocromática. Correcta.
- 3 niveles de sombra (xs, sm, md, lg). Sistema correcto.
- Motion tokens definidos. Correcto.
- Fase 1 del roadmap mayoritariamente completada en commits anteriores.

## Fuentes
- 3 fuentes cargadas: Plus Jakarta Sans, Inter, Orbitron — todas vía Google Fonts @import.
- NO self-hosteadas ni con <link rel="preload">. Riesgo de FOUT.
- Orbitron solo se usa en el wordmark del header (NewDashboardLayout.tsx:637-649).
- Inter es fallback; Plus Jakarta Sans es la fuente principal.
- font-feature-settings activos en html. Correcto.

## Wordmark (RESUELTO — 2026-04-25)
- Token --brand-accent: 181 74% 55% añadido en src/index.css (bloque tokens, antes de aliases legacy).
- Clases .font-orbitron y .wordmark-glow añadidas en @layer components de src/index.css.
- NewDashboardLayout.tsx:637-641: todos los inline styles eliminados. Usa font-orbitron wordmark-glow.
- Decisión de marca: teal canonizado como segundo color de identidad Nomadev (diferencia wordmark del azul de acciones).

## Migración de páginas al sistema de tokens (2026-04-25)
### COMPLETADO (Fases B + D):
- AuthSuccessPage.tsx: migrado a tokens
- LoginPage.tsx: migrado. RippleGrid gridColor="#10b981" EXCEPCIÓN — canvas WebGL, no acepta CSS vars
- RegisterPage.tsx: migrado (mismo patrón que LoginPage, incluyendo wordmark-glow)
- EmailVerificationPage.tsx: migrado
- BrandIdentityPage.tsx: migrado (3 cambios puntuales)
- ChatPage.tsx: migrado completamente
- ProfilePage.tsx: migrado (3 cambios puntuales)
- SettingsPage.tsx: migrado
- NotFound.tsx: migrado
- ShopifyConnectPage.tsx: migrado
- DropiConnectPage.tsx: migrado

### PENDIENTE (Fase E — requiere luz verde del usuario):
- 12 páginas demo: ChatDemo, CRMDemo, DemoPage, InteractiveDemo, LeadsDemo, OrdersDemo, ScheduleDemoPage, SettingsDemo, ShopifyDemo, StudioIADemo, TrackingDemo, ValidationDemo

### TAMBIÉN PENDIENTE (no auditadas aún):
- OrdersPage.tsx, WhatsAppIntegrationPage.tsx, ValidationPage.tsx, WebsiteBuilderPage.tsx, WhatsAppChatPage.tsx, TrackingPage.tsx, ShopifyPage.tsx, SecurityDashboard.tsx, ProductImageGeneratorPage.tsx, PriceOptimizerPage.tsx, OrderValidationPage.tsx, LogoGeneratorPage.tsx, OnboardingPage.tsx, LandingPage.tsx, DropiPage.tsx, CopywritingPage.tsx, CRMPage.tsx, AgentHubPage.tsx, AgentBuilderPage.tsx

### EXCEPCIÓN DOCUMENTADA:
- RippleGrid gridColor prop (en LoginPage, RegisterPage, EmailVerificationPage): prop string para canvas WebGL, no puede consumir CSS variables. Mantener hardcoded "#10b981".

## Componentes base (src/components/ui/)
- Button, Card, Badge, Input, Dialog: todos limpios, usan tokens, bien construidos.
- MetricCard: patrón sólido, correcto.
- sidebar.tsx: componente Radix completo y limpio.
- custom-cursor.tsx: usa text-emerald-500 hardcodeado. Minor.
- 56 componentes en total — algunos legacy no auditados (globe.tsx, hero-video-dialog.tsx, orbiting-circles.tsx).

## Buscador inline vs CommandPalette (RESUELTO — 2026-04-25)
- Dialog inline eliminado de NewDashboardLayout.tsx.
- Botón del header ahora abre CommandPalette vía useCommandPalette hook.
- ⌘K y botón lupa hacen exactamente lo mismo (ambos setCommandPaletteOpen(true)).
- handleSearch, searchDatabase de 25 items y estado relacionado eliminados (~100 líneas).

## Problema medio #4: DashboardLayout thin wrapper
- DashboardLayout.tsx es un wrapper de 9 líneas que solo re-exporta NewDashboardLayout.
- Todas las páginas importan DashboardLayout, que delega a NewDashboardLayout. Indirección innecesaria.

## Páginas nuevas (Team, Billing, KeyboardShortcuts)
- Patrón consistente: DashboardLayout + glass-card + icon badge (bg-primary/10) + CardTitle con icono.
- Limpias, sin deuda. Buen patrón a seguir para páginas futuras.

## DropiOrdersPanel.tsx
- Componente extenso (1206 líneas). Bien estructurado pero monolítico.
- Usa inline chartTheme con hsl(var(--...)) — correcto para recharts que no puede leer CSS vars.
- Algunos inline styles en Cell de recharts con backgroundColor dinámico — justificado.

## Estado del roadmap
- Fase 1: COMPLETA. Tokens limpios, line-height correcto, sin !important patológicos, scrollbar sobria.
- Fase C (self-host fuentes): COMPLETA (2026-04-25).
  - 16 archivos WOFF2 en public/fonts/ (8 PJS + 7 Inter + 1 Orbitron).
  - @font-face con weight ranges (400 800 / 400 700 / 400 900) — menos reglas que Google Fonts.
  - 3 preloads en index.html: latin de PJS + Inter + Orbitron.
  - Los @import url(fonts.googleapis.com) eliminados.
  - Nota: index.html aún tiene background-color:#000000 inline en <html>/<body>/<div#root> — deuda Fase 1 restante.
- Fase 2: tokens 2026 definidos. --brand-accent (teal wordmark) añadido. Pendiente: revisar si HeroUI se queda.
- Fase 3: componentes base sólidos. Pendiente: decidir HeroUI (está en tailwind.config plugins pero apenas se usa).
- Fase A2: consolidación buscadores completada.
- Fase B+D: 11 páginas activas migradas a tokens.
- Fase E: CANCELADA — 12 páginas demo son mocks de referencia interna, no producción.
