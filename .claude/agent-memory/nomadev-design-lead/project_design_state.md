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

## Problema crítico #1: Wordmark hardcodeado con inline styles
- NewDashboardLayout.tsx:637-649: el wordmark NOMADEV.IO usa style={{ fontFamily, textShadow, filter, transform }}
- Color hardcodeado: text-teal-400 + rgba(45,212,191,...) — fuera del sistema de tokens.
- skew(-3deg) en transform inline — no hay token para esto.
- La marca visual usa teal/esmeralda pero el sistema de diseño es azul (217 91% 60%). Fricción de marca.

## Problema crítico #2: Páginas legacy sin migrar al sistema
- AuthSuccessPage.tsx: usa slate-900, emerald-900, gray-900/90, gray-700, text-white, text-gray-300/400, green-500/600. 100% fuera del sistema de tokens.
- LoginPage.tsx: usa RippleGrid con gridColor="#10b981" hardcodeado.
- BrandIdentityPage.tsx: usa from-green-500 to-emerald-500 en botones.
- ChatPage.tsx: usa from-green-600 to-emerald-600 en botones.
- 38+ páginas demo/* sin auditar — muchas probablemente también con colores hardcodeados.

## Componentes base (src/components/ui/)
- Button, Card, Badge, Input, Dialog: todos limpios, usan tokens, bien construidos.
- MetricCard: patrón sólido, correcto.
- sidebar.tsx: componente Radix completo y limpio.
- custom-cursor.tsx: usa text-emerald-500 hardcodeado. Minor.
- 56 componentes en total — algunos legacy no auditados (globe.tsx, hero-video-dialog.tsx, orbiting-circles.tsx).

## Problema medio #3: Buscador inline vs CommandPalette duplicado
- NewDashboardLayout.tsx tiene un Dialog de búsqueda propio (líneas 547-619) con base de datos hardcodeada de 25 items.
- CommandPalette.tsx es un componente separado con su propia lista de comandos.
- Son dos sistemas de búsqueda paralelos. Solo uno debería existir (CommandPalette con cmdk-style).
- El Dialog de búsqueda inline NO está conectado al CommandPalette — ⌘K abre el CommandPalette pero el botón del header abre el Dialog inline.

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
- Fase 1: ~90% completa (tokens limpios, line-height correcto, sin !important patológicos, scrollbar sobria).
- Pendiente Fase 1: self-host fuentes o preload.
- Fase 2: tokens 2026 definidos. Pendiente: añadir --brand-wordmark token para el teal del logo.
- Fase 3: componentes base sólidos. Pendiente: decidir HeroUI (está en tailwind.config plugins pero apenas se usa).
- Fase 4-5: páginas legacy sin migrar (AuthSuccessPage, ChatPage, BrandIdentityPage, 15+ demo pages).
