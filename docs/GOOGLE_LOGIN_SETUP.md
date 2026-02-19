# Configurar inicio de sesión con Google en Supabase

Para que el botón "Continuar con Google" funcione, hay que configurar **Google Cloud Console** y **Supabase**.

---

## 1. Google Cloud Console (crear credenciales OAuth)

1. Entra en [Google Cloud Console](https://console.cloud.google.com/).
2. Crea o selecciona un proyecto.
3. Ve a **APIs y servicios** → **Credenciales**.
4. Pulsa **+ Crear credenciales** → **ID de cliente de OAuth**.
5. Si te lo pide, configura la **pantalla de consentimiento de OAuth** (tipo "Externo", nombre de la app, email de soporte).
6. En tipo de aplicación elige **Aplicación web**.
7. **Nombre**: por ejemplo "NOMADEV Login".
8. En **URIs de redirección autorizados** añade exactamente:
   ```text
   https://rxgrhvrseejzbzneabrz.supabase.co/auth/v1/callback
   ```
   (Usa la URL que te muestra Supabase en el panel de Google si es distinta.)
9. Guarda. Copia el **ID de cliente** (ej: `123456789-xxxx.apps.googleusercontent.com`) y el **Secreto del cliente**.

Importante: el **Client ID** es el que termina en `.apps.googleusercontent.com`, **no** tu email (p. ej. `skalechile@gmail.com`).

---

## 2. Supabase (activar proveedor Google)

1. En el proyecto: **Authentication** → **Providers** → **Google**.
2. **Habilitar inicio de sesión con Google**: activar el interruptor.
3. **IDs de cliente**: pegar solo el **Client ID** de Google (el que termina en `.apps.googleusercontent.com`). No pongas tu email.
4. **Secreto del cliente (para OAuth)**: pegar el **Client Secret** de Google.
5. Dejar **Omitir comprobaciones de "nonce"** y **Permitir usuarios sin correo** como prefieras (por defecto desactivados está bien).
6. **Guardar**.

La **URL de retorno de llamada (Callback URL)** que muestra Supabase debe ser la misma que añadiste en Google (paso 1.8).

---

## 3. URLs de redirección en Supabase

Para que tras el login con Google te envíe a tu app:

1. En Supabase: **Authentication** → **URL Configuration**.
2. En **Redirect URLs** añade las URLs donde corre tu app, por ejemplo:
   - `http://localhost:5173/dashboard` (desarrollo)
   - `https://tudominio.com/dashboard` (producción)
3. Guarda.

Así, después de autenticarse con Google, el usuario volverá a `/dashboard`.

---

## Resumen de errores frecuentes

| Problema | Solución |
|----------|----------|
| "Client ID" con un email | Usar el ID que termina en `.apps.googleusercontent.com` desde Google Cloud. |
| "redirect_uri_mismatch" | La URL en "URIs de redirección autorizados" (Google) debe ser exactamente la Callback URL de Supabase. |
| Tras Google vuelve a login | Añadir tu URL (ej. `http://localhost:5173/dashboard`) en **Redirect URLs** de Supabase. |

Cuando esto esté configurado, el botón "Continuar con Google" en la página de login redirigirá a Google y, al autorizar, volverá a tu app en `/dashboard`.
