# Plan: Configuración funcional — persistencia del perfil de usuario

> **Para agentes:** SUB-SKILL OBLIGATORIA: usar superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para ejecutar este plan tarea por tarea. Los pasos usan checkboxes (`- [ ]`).

**Goal:** Que `Editar perfil → Guardar` en `/profile` persista de verdad nombre/apellido/teléfono/dirección/avatar en Supabase, con email readonly, sin tocar el resto de `/settings` ni el flujo de auth.

**Architecture:** Crear la tabla `public.profiles` que el `AuthContext` ya intenta usar pero no existe; sumar trigger `handle_new_user` para autocrear filas, bucket `avatars` en Storage para imágenes, y backfill de los `auth.users` actuales. Cambios mínimos en `AuthContext.tsx` (tipos + firma de `updateProfile` sin email) y `ProfilePage.tsx` (email siempre readonly + upload real de avatar + toasts con sonner + "Miembro desde" desde `created_at`).

**Tech Stack:** React 19 + TypeScript + Vite, Supabase (Postgres + Auth + Storage), shadcn/radix UI, sonner para toasts, MCP de Supabase para aplicar migraciones.

**Spec:** `docs/superpowers/specs/2026-04-28-settings-profile-functional-design.md`

**Nota sobre testing:** El repo no tiene framework de tests automatizados (ni `vitest`, ni `jest`, ni `playwright`). La verificación se hace con: (a) `npm run lint`, (b) `npm run build` (incluye chequeo TypeScript), (c) verificación manual en el dev server con la cuenta `nomadev@test.io`. Cada tarea define su propia verificación.

---

## File Structure

**Crear:**
- `supabase/migrations/20260428120000_create_profiles_and_avatars.sql` — tabla `profiles`, RLS, triggers, bucket `avatars` con sus policies, backfill de usuarios existentes.

**Modificar:**
- `src/contexts/AuthContext.tsx`:
  - tipo `User`: agregar `phone`, `address`, `avatar`.
  - `loadUserProfile`: mapear nuevos campos.
  - `updateProfile`: nueva firma sin `email`; aceptar `phone`, `address`, `avatarUrl`.
  - `register`: cambiar `insert` por `upsert` en `profiles` para no chocar con el trigger.
- `src/pages/ProfilePage.tsx`:
  - email siempre `disabled`/`readOnly`, fuera del `formData`, leído de `user.email`.
  - `handleSave`: upload de avatar a Storage si cambió, validación firstName/lastName no vacíos, llamada a `updateProfile` con la nueva firma.
  - `handleImageUpload`: guardar el `File` además del data URL para subirlo después.
  - reemplazar `alert(...)` por `toast.error(...)` de sonner; agregar `toast.success(...)` al guardar OK.
  - "Miembro desde" desde `user.createdAt` formateado en español.

---

## Task 1: Migración Supabase — tabla `profiles`, triggers, bucket avatars, backfill

**Files:**
- Create: `supabase/migrations/20260428120000_create_profiles_and_avatars.sql`

- [ ] **Step 1: Verificar que la tabla y el bucket no existen (estado de partida)**

Usar el MCP de Supabase:
```
mcp__supabase__execute_sql({
  query: "SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'profiles';"
})
```
Esperado: `[]` (vacío, confirma que la tabla no existe).

```
mcp__supabase__execute_sql({
  query: "SELECT id FROM storage.buckets WHERE id = 'avatars';"
})
```
Esperado: `[]` (bucket no existe).

```
mcp__supabase__execute_sql({
  query: "SELECT id, email, raw_user_meta_data FROM auth.users ORDER BY created_at;"
})
```
Esperado: lista de usuarios actuales (mínimo 1: `nomadev@test.io`). Anotar cuántos son para verificar el backfill después.

- [ ] **Step 2: Escribir el archivo de migración**

Crear `supabase/migrations/20260428120000_create_profiles_and_avatars.sql` con el contenido EXACTO siguiente:

```sql
-- Perfil del usuario: tabla espejo de auth.users con campos editables
-- (first_name, last_name, phone, address, avatar_url). Email se mantiene
-- como espejo informativo de auth.users.email; no editable desde la app.

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  first_name  TEXT NOT NULL DEFAULT '',
  last_name   TEXT NOT NULL DEFAULT '',
  phone       TEXT,
  address     TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_profiles_updated_at();

-- Trigger handle_new_user: crea fila en profiles cuando se crea un auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Backfill: crear filas para auth.users que ya existen
INSERT INTO public.profiles (id, email, first_name, last_name)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', split_part(u.email, '@', 1)) AS first_name,
  COALESCE(u.raw_user_meta_data->>'last_name', '') AS last_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Storage bucket para avatars: público en lectura, write solo del owner
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policies del bucket: path debe empezar con {auth.uid()}/
DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_owner_delete" ON storage.objects;

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

COMMENT ON TABLE public.profiles IS 'Perfil del usuario: nombre, apellido, teléfono, dirección, avatar. Email es espejo de auth.users.email (no editable desde la app).';
COMMENT ON COLUMN public.profiles.email IS 'Espejo informativo de auth.users.email. La fuente de verdad sigue siendo auth.users.';
```

- [ ] **Step 3: Aplicar la migración con MCP Supabase**

```
mcp__supabase__apply_migration({
  name: "create_profiles_and_avatars",
  query: "<contenido íntegro del archivo .sql del Step 2>"
})
```

Esperado: respuesta sin errores. Si hay error, leer el mensaje, corregir el SQL del archivo y reintentar.

- [ ] **Step 4: Verificar el resultado en la base de datos**

```
mcp__supabase__execute_sql({
  query: "SELECT id, email, first_name, last_name, phone, address, avatar_url FROM public.profiles;"
})
```
Esperado: una fila por cada usuario en `auth.users` (mínimo `nomadev@test.io` con `first_name = 'nomadev'` por el `split_part`).

```
mcp__supabase__execute_sql({
  query: "SELECT id, public FROM storage.buckets WHERE id = 'avatars';"
})
```
Esperado: `[{id: "avatars", public: true}]`.

```
mcp__supabase__execute_sql({
  query: "SELECT polname FROM pg_policies WHERE tablename = 'profiles' ORDER BY polname;"
})
```
Esperado: las 3 policies (`profiles_insert_own`, `profiles_select_own`, `profiles_update_own`).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260428120000_create_profiles_and_avatars.sql
git commit -m "feat(db): tabla profiles, trigger handle_new_user, bucket avatars + backfill"
```

---

## Task 2: AuthContext — tipos y firma de `updateProfile` sin email, mapeo de phone/address/avatar

**Files:**
- Modify: `src/contexts/AuthContext.tsx`

- [ ] **Step 1: Extender el tipo `User` con phone, address, avatar**

En `src/contexts/AuthContext.tsx` localizar la interface `User` (alrededor de la línea 12) y reemplazarla por:

```ts
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  address: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
}
```

- [ ] **Step 2: Cambiar la firma de `updateProfile` en la interface `AuthContextType` (sin email)**

Reemplazar el bloque `updateProfile` dentro de `AuthContextType` por:

```ts
  updateProfile: (profileData: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    address?: string | null;
    avatarUrl?: string | null;
  }) => Promise<void>;
```

- [ ] **Step 3: Que `buildQuickUser` cumpla el nuevo tipo (phone/address/avatar = null)**

Reemplazar `buildQuickUser` por:

```ts
  const buildQuickUser = (supabaseUser: SupabaseUser): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    firstName: supabaseUser.user_metadata?.first_name || 'Usuario',
    lastName: supabaseUser.user_metadata?.last_name || '',
    phone: null,
    address: null,
    avatar: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
```

- [ ] **Step 4: `loadUserProfile` lee y mapea phone/address/avatar_url**

Localizar el `setUser({ ... })` dentro del bloque exitoso de `loadUserProfile` (al final de la función) y reemplazar el objeto entero por:

```ts
      setUser({
        id: profile.id,
        email: profile.email,
        firstName: profile.first_name ?? '',
        lastName: profile.last_name ?? '',
        phone: profile.phone ?? null,
        address: profile.address ?? null,
        avatar: profile.avatar_url ?? null,
        isActive: true,
        createdAt: profile.created_at,
      });
```

- [ ] **Step 5: `register()` cambia `insert` por `upsert` con `onConflict: 'id'`**

Localizar el bloque `if (data.user) { supabase.from('profiles').insert({ ... }) ... }` y reemplazar `.insert(...)` por `.upsert(..., { onConflict: 'id' })`. Resultado:

```ts
      if (data.user) {
        // El trigger handle_new_user crea la fila; este upsert es red de seguridad.
        supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: userData.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
          }, { onConflict: 'id' })
          .then(({ error: profileError }) => {
            if (profileError) console.warn('Error creando perfil tras registro:', profileError);
          });
      }
```

- [ ] **Step 6: Reemplazar la implementación de `updateProfile` por una sin email + nuevos campos**

Localizar la función `updateProfile` y reemplazar su cuerpo entero por:

```ts
  const updateProfile = async (profileData: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    address?: string | null;
    avatarUrl?: string | null;
  }) => {
    try {
      setError(null);

      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const updates: Record<string, string | null> = {};
      if (profileData.firstName !== undefined) updates.first_name = profileData.firstName;
      if (profileData.lastName !== undefined) updates.last_name = profileData.lastName;
      if (profileData.phone !== undefined) updates.phone = profileData.phone;
      if (profileData.address !== undefined) updates.address = profileData.address;
      if (profileData.avatarUrl !== undefined) updates.avatar_url = profileData.avatarUrl;

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        setError(error.message);
        throw error;
      }

      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        await loadUserProfile(supabaseUser);
      }
    } catch (error: any) {
      setError(error.message || 'Error inesperado al actualizar perfil');
      throw error;
    }
  };
```

- [ ] **Step 7: Verificar tipos y lint**

Ejecutar:
```bash
npm run lint
```
Esperado: sin errores nuevos. Si aparecen warnings preexistentes en otros archivos (no en `AuthContext.tsx`) se ignoran.

```bash
npm run build
```
Esperado: build OK (`tsc` valida tipos). Es esperable que falle si `ProfilePage.tsx` aún usa la firma vieja de `updateProfile` con email; en ese caso es la señal de que la Task 3 va a tener que arreglar esos llamadores. **No commitear todavía** si el build falla solo por ProfilePage; eso lo cierra la Task 3.

> Si el build pasa porque ningún otro archivo llama a `updateProfile` con email aparte de ProfilePage, commitear ya:

- [ ] **Step 8: (Si build pasó) Commit**

```bash
git add src/contexts/AuthContext.tsx
git commit -m "feat(auth): tipo User con phone/address/avatar; updateProfile sin email; upsert en register"
```

> Si el build no pasó por ProfilePage, omitir este commit y hacer un commit conjunto al final de la Task 3.

---

## Task 3: ProfilePage — email readonly, upload de avatar a Storage, validación, sonner, "miembro desde"

**Files:**
- Modify: `src/pages/ProfilePage.tsx`

- [ ] **Step 1: Agregar imports nuevos (toast de sonner, supabase client)**

En la cabecera de `src/pages/ProfilePage.tsx` agregar:

```ts
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
```

(El alias `@/integrations/supabase/client` es el mismo que usa `AuthContext.tsx`.)

- [ ] **Step 2: Quitar email del formData y usar `user.email` directo**

Localizar el `useState` de `formData` (alrededor de la línea 28) y reemplazarlo por:

```tsx
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
```

- [ ] **Step 3: `handleImageUpload` además guarda el File para subirlo después**

Reemplazar la función `handleImageUpload` por:

```tsx
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecciona un archivo de imagen válido');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
```

- [ ] **Step 4: Reemplazar `handleSave` por la versión que sube avatar y persiste cambios**

Reemplazar la función `handleSave` por:

```tsx
  const handleSave = async () => {
    if (!user) return;

    if (formData.firstName.trim() === '' || formData.lastName.trim() === '') {
      toast.error('Nombre y apellido no pueden quedar vacíos');
      return;
    }

    try {
      setIsLoading(true);

      let avatarUrl: string | undefined = undefined;

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()?.toLowerCase() || 'png';
        const path = `${user.id}/avatar-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true, cacheControl: '3600' });

        if (uploadError) {
          toast.error('No se pudo subir la imagen: ' + uploadError.message);
          setIsLoading(false);
          return;
        }

        const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
        avatarUrl = pub.publicUrl;
      }

      await updateProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      });

      setAvatarFile(null);
      setIsEditing(false);
      toast.success('Perfil actualizado');
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      toast.error('No se pudo guardar el perfil');
    } finally {
      setIsLoading(false);
    }
  };
```

- [ ] **Step 5: `handleCancel` resetea también `avatarFile`**

Reemplazar la función `handleCancel` por:

```tsx
  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
    setProfileImage(user?.avatar || null);
    setAvatarFile(null);
    setIsEditing(false);
  };
```

- [ ] **Step 6: Eliminar el input de email del JSX y reemplazar por uno readonly que lee `user.email`**

En el JSX (alrededor de la línea 170) localizar el bloque:

```tsx
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={!isEditing}
                    placeholder="tu@email.com"
                  />
                </div>
```

Y reemplazarlo por:

```tsx
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    readOnly
                    className="bg-muted/50"
                    placeholder="tu@email.com"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    El email no se puede modificar.
                  </p>
                </div>
```

- [ ] **Step 7: Reemplazar "Miembro desde" hardcodeado por `user.createdAt` formateado**

Localizar el bloque "Miembro desde" en el JSX (alrededor de la línea 277):

```tsx
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Miembro desde</p>
                    <p className="text-xs text-muted-foreground">Enero 2024</p>
                  </div>
                </div>
```

Reemplazarlo por:

```tsx
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Miembro desde</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.createdAt
                        ? new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' })
                            .format(new Date(user.createdAt))
                        : '—'}
                    </p>
                  </div>
                </div>
```

- [ ] **Step 8: Sincronizar `formData` y `profileImage` cuando cambia `user` (post-save y post-login)**

Después del `useState` inicial agregar un `useEffect` que reescriba el form cuando llega un `user` nuevo desde el contexto:

```tsx
  useEffect(() => {
    if (!user) return;
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      address: user.address || '',
    });
    setProfileImage(user.avatar || null);
  }, [user]);
```

Asegurarse de que `useEffect` esté importado: `import { useEffect, useState } from 'react';` (modificar la línea de import existente, no duplicarla).

- [ ] **Step 9: Lint + build**

```bash
npm run lint
```
Esperado: sin errores nuevos en `ProfilePage.tsx`.

```bash
npm run build
```
Esperado: build OK. Si falla, leer el error de TypeScript, corregir, repetir.

- [ ] **Step 10: Verificación manual en dev server**

```bash
npm run dev
```

Abrir el navegador en la URL que muestra Vite (típicamente `http://localhost:5173`), iniciar sesión con `nomadev@test.io` y la contraseña conocida, e ir a `/profile`.

Checklist de verificación:
1. Ver que el nombre cargado es `nomadev` (viene del backfill `split_part(email, '@', 1)`).
2. Click en "Editar" → cambiar nombre a "Antonio", apellido a "Test", teléfono a "+57 300 0000000", dirección a "Calle 1".
3. Verificar que el input de email aparece deshabilitado y dice "El email no se puede modificar." debajo.
4. Click "Guardar" → toast verde "Perfil actualizado". El sidebar debe mostrar "Antonio" sin recargar.
5. F5 → los datos persisten.
6. Click en "Editar" → click en el avatar → seleccionar una imagen JPG/PNG <5MB → preview aparece.
7. Click "Guardar" → toast "Perfil actualizado" → F5 → la imagen sigue visible.
8. Verificar en `/settings`: el botón "Editar perfil" lleva al perfil que ahora persiste.

Si alguno de los pasos falla, leer la consola del navegador y la response de Supabase, corregir, repetir.

- [ ] **Step 11: Verificación en BD**

```
mcp__supabase__execute_sql({
  query: "SELECT id, email, first_name, last_name, phone, address, avatar_url FROM public.profiles WHERE email = 'nomadev@test.io';"
})
```
Esperado: la fila refleja los cambios hechos en el dev server.

```
mcp__supabase__execute_sql({
  query: "SELECT name, bucket_id FROM storage.objects WHERE bucket_id = 'avatars' ORDER BY created_at DESC LIMIT 5;"
})
```
Esperado: aparece el archivo subido bajo `{user_id}/avatar-{timestamp}.{ext}`.

- [ ] **Step 12: Commit**

```bash
git add src/contexts/AuthContext.tsx src/pages/ProfilePage.tsx
git commit -m "feat(profile): persistir nombre/teléfono/dirección/avatar; email readonly; toasts con sonner"
```

> Si en la Task 2 ya hubo commit de `AuthContext.tsx`, este commit incluye solo `ProfilePage.tsx`.

---

## Task 4: Verificación final + cierre

- [ ] **Step 1: Lint completo del proyecto**

```bash
npm run lint
```
Esperado: sin errores nuevos. Comparar con el estado pre-cambios si hay duda.

- [ ] **Step 2: Build completo**

```bash
npm run build
```
Esperado: build OK.

- [ ] **Step 3: Smoke test de no-regresión**

En el dev server:
1. Logout → ir a `/login` → login con `nomadev@test.io` → ¿entra al dashboard sin error? (verifica que `loadUserProfile` y la nueva tabla no rompen el login).
2. `/dashboard` → ¿carga la KPI de Dropi como antes? (verifica que las nuevas RLS policies no afectan a tablas vecinas).
3. Sidebar muestra el nombre actualizado.

- [ ] **Step 4: Documentar lo terminado en una nota corta para el README de specs**

Editar `docs/superpowers/specs/2026-04-28-settings-profile-functional-design.md` cambiando el header `**Estado:**` de `Diseño aprobado, pendiente plan de implementación` a `Implementado el 2026-04-28`.

```bash
git add docs/superpowers/specs/2026-04-28-settings-profile-functional-design.md
git commit -m "docs(spec): marcar perfil funcional como implementado"
```

---

## Self-review checklist (autor del plan)

- ✅ Cada paso es un commit chiquito o una verificación concreta.
- ✅ El SQL de la migración está completo (no hay TBD).
- ✅ Los snippets TypeScript están completos y compilan.
- ✅ Las firmas coinciden entre Task 2 (definición) y Task 3 (consumo): `updateProfile({ firstName, lastName, phone, address, avatarUrl })`.
- ✅ El plan no asume tests automatizados (el repo no tiene framework).
- ✅ Cubre todo el spec: tabla + triggers + bucket + backfill + AuthContext + ProfilePage + verificación + email readonly.
- ✅ El "fuera de alcance" del spec se respeta: no se tocan otras páginas ni el flujo de auth.
