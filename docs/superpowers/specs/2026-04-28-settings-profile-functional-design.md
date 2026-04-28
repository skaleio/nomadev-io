# Configuración funcional: persistencia del perfil de usuario

**Fecha:** 2026-04-28
**Estado:** Diseño aprobado, pendiente plan de implementación

## Problema

En `/profile` (al que se llega desde `/settings → Editar perfil`) el usuario ve un formulario "editable" con nombre, apellido, email, teléfono y dirección. Al pulsar **Guardar** la UI cierra el modo edición como si todo hubiera ido bien, pero **nada se persiste**.

Causa raíz verificada con MCP de Supabase: `AuthContext.updateProfile` ejecuta `supabase.from('profiles').update(...)`, pero la tabla `public.profiles` **no existe**. El error se traga porque la promesa resuelve con `error` no nulo y el catch solo guarda el mensaje en estado local sin notificar al usuario. El insert que hace `register()` también falla por la misma razón, por lo que ningún usuario tiene fila de perfil.

Además, el formulario permite editar el campo email aunque cambiar el email del lado de Supabase Auth no se hace ahí — y el usuario explícitamente no quiere que sea modificable.

## Alcance

**Dentro:**
- Que `Editar perfil → Guardar` persista nombre, apellido, teléfono, dirección y avatar.
- Que el campo email quede readonly siempre (incluso en modo edición).
- Que al recargar la página o reloguear los datos sigan ahí.
- Que el sidebar (que muestra el nombre vía `useAuth`) refleje el cambio sin recargar.
- Que el avatar suba realmente a Supabase Storage (hoy solo se previsualiza con FileReader y se pierde al recargar).
- Que el campo "Miembro desde" muestre el `created_at` real del perfil en vez del literal "Enero 2024".
- Backfill: crear fila de perfil para los usuarios que ya existen en `auth.users` (mínimo 1: `nomadev@test.io`).

**Fuera:**
- Cambiar el flujo de autenticación (signin/signup, redirecciones, manejo de sesión). El insert de `register()` se ajusta a `upsert` solo como red de seguridad ante el nuevo trigger; no cambia comportamiento observable.
- Tocar el resto de `/settings` (estado del sistema, integraciones, próximamente).
- Cambio de contraseña, 2FA, idioma, tema, notificaciones.
- Cualquier refactor no relacionado con el guardado del perfil.

## Diseño

### Base de datos

Nueva tabla `public.profiles` (vía migración Supabase):

| Columna     | Tipo        | Notas                                              |
|-------------|-------------|----------------------------------------------------|
| id          | uuid PK     | FK → `auth.users.id` ON DELETE CASCADE             |
| email       | text        | Espejo del email de auth (informativo, no editable)|
| first_name  | text        |                                                    |
| last_name   | text        |                                                    |
| phone       | text NULL   |                                                    |
| address     | text NULL   |                                                    |
| avatar_url  | text NULL   | URL pública del bucket `avatars`                   |
| created_at  | timestamptz | default `now()`                                    |
| updated_at  | timestamptz | default `now()`, actualizado por trigger           |

**RLS:** activado.
- `select`: `auth.uid() = id`
- `insert`: `auth.uid() = id`
- `update`: `auth.uid() = id`
- Sin política de delete (la cascada del FK basta).

**Trigger `handle_new_user`** en `auth.users` AFTER INSERT que crea la fila de perfil automáticamente con los datos de `raw_user_meta_data` (first_name, last_name) si están presentes. Esto evita la doble vía (trigger + insert manual desde `register()`) que hoy es ruidosa.

**Trigger `set_updated_at`** en `profiles` BEFORE UPDATE que setea `updated_at = now()`.

**Backfill:** insertar filas para los `auth.users` que ya existen, leyendo first_name/last_name de `raw_user_meta_data` y usando `split_part(email, '@', 1)` como first_name por defecto si no hay metadata.

### Storage

- Bucket `avatars`, público para lectura.
- Política: solo el owner puede `insert`/`update`/`delete` archivos cuyo path empiece con `{auth.uid()}/`.
- Convención de path: `{user_id}/avatar-{timestamp}.{ext}` (timestamp evita cache stale del CDN tras reemplazar el avatar).

### Cambios en código

**`src/contexts/AuthContext.tsx`:**
- Tipo `User` agrega `phone?: string | null`, `address?: string | null`, `avatar?: string | null`.
- `loadUserProfile` lee y mapea `phone`, `address`, `avatar_url`.
- `updateProfile` cambia su firma:
  ```ts
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    address?: string | null;
    avatarUrl?: string | null;
  }) => Promise<void>
  ```
  **Removido:** `email`. Si por alguna razón se intenta pasar email, se ignora (defensa en profundidad — el formulario tampoco lo permitirá).
- El insert manual de `register()` queda como fallback por si el trigger no corre (usar `upsert` con `onConflict: 'id'` para no fallar si el trigger ya creó la fila).

**`src/pages/ProfilePage.tsx`:**
- Email input: `disabled` siempre, `readOnly`, sin handler `onChange`. Quitar del `formData` y leer directo de `user.email`.
- Estado inicial del form: incluir `phone`, `address` con defaults vacíos cuando vienen `null`.
- Avatar:
  - Mantener preview local con FileReader para feedback instantáneo.
  - En `handleSave`: si `profileImage` cambió respecto a `user.avatar`, subir el File a `avatars/{user.id}/avatar-{Date.now()}.{ext}`, obtener `publicUrl`, pasarla a `updateProfile`.
  - Si la subida falla: mostrar toast de error específico, **no** revertir los cambios de texto que sí se guardaron.
- Reemplazar los `alert(...)` actuales por `toast` de `sonner` (librería ya en uso en el repo: `Dashboard.tsx`, `DropiOrdersPanel.tsx`, etc.).
- "Miembro desde" lee `user.createdAt` formateado con `Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' })`.
- Validación: si `firstName.trim() === ''` o `lastName.trim() === ''`, deshabilitar botón Guardar y mostrar mensaje inline.

### Flujo al guardar

1. Click **Guardar** → loading state.
2. Validar firstName/lastName no vacíos.
3. Si cambió avatar:
   - `upload` al bucket → si falla, toast de error y abortar (no toca DB).
   - Obtener `publicUrl`.
4. `updateProfile({ firstName, lastName, phone, address, avatarUrl })`.
5. `AuthContext.updateProfile` hace `supabase.from('profiles').update(...)` y luego `loadUserProfile()` para refrescar el contexto.
6. Toast de éxito + salir del modo edición.

### No-rotura

- El `register()` sigue funcionando: el trigger crea la fila; el upsert manual queda como red de seguridad y no falla aunque la fila ya exista.
- El `loadUserProfile()` actual ya tiene fallback al "perfil rápido" si la query a `profiles` falla, así que durante el deploy de la migración no hay pantalla en blanco.
- Email permanece como antes en `auth.users`; no se toca esa fuente.
- Los componentes que consumen `useAuth()` (sidebar, etc.) no necesitan cambios — siguen leyendo `user.firstName`/`user.email`.

## Verificación manual

1. `nomadev@test.io` (usuario existente) entra a `/profile` → ve sus datos correctamente cargados (first_name desde el backfill).
2. Edita nombre y apellido, guarda → toast de éxito → recarga F5 → datos persisten.
3. Sube un avatar → guarda → recarga → avatar persiste y se muestra en la card lateral.
4. Intenta hacer click en el input de email → no permite escribir (input deshabilitado y readonly).
5. Edita teléfono y dirección → guarda → recarga → persisten.
6. Logout y login otra vez → datos siguen ahí.
7. Sidebar muestra el nuevo nombre tras guardar sin necesidad de recargar.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Migración corre en prod y rompe el login mientras tanto | El `loadUserProfile` ya tolera fallo de query; downtime cero |
| Backfill mete datos incorrectos | Dry-run primero con `select` que muestre lo que insertaría |
| Avatar viejo queda colgando en Storage tras cambiar | Aceptable como TODO de housekeeping; no afecta funcionalidad |
| Trigger `handle_new_user` no corre por algún motivo | El upsert en `register()` actúa como red de seguridad |
| Usuarios con metadata `first_name = "Usuario"` (default del buildQuickUser) terminan con ese literal | El backfill respeta lo que ya hay; no sobrescribe |
