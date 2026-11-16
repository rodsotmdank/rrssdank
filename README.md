# Calendario de campaña Dank (ROSTA / Airscrape)

App Next.js + Supabase para planificar publicaciones de LinkedIn: guarda estados, textos y fechas, permite subir un PDF de carrusel por publicación y exige usuario y contraseña.

## Paso a paso

### 1. Crear el proyecto en Supabase
1. Entra a https://supabase.com, crea una cuenta y un proyecto nuevo (guarda la contraseña de la base).
2. Menú **SQL Editor → New query**, pega todo `supabase/schema.sql` y presiona **Run**. Crea tablas, permisos y el bucket privado `carruseles`.
3. (Opcional) Ejecuta también `supabase/seed.sql` para cargar los datos que ya tenías en el artefacto.

### 2. Cerrar el registro y crear usuarios
1. **Authentication → Providers → Email**: desactiva **Allow new users to sign up** (nadie podrá registrarse solo) y, si quieres, desactiva "Confirm email".
2. **Authentication → Users → Add user → Create new user**: ingresa correo y contraseña, marca *Auto Confirm User*. Repite por cada persona.

### 3. Obtener las llaves
En **Project Settings → API** copia **Project URL** y la llave **anon public**.

### 4. Probar en tu computador (opcional)
```
cp .env.example .env.local   # pega las dos llaves
npm install
npm run dev                  # http://localhost:3000
```

### 5. Subir a GitHub
Crea un repositorio privado y sube esta carpeta (`.env*` y `node_modules` ya están excluidos en `.gitignore`).

### 6. Publicar en Vercel
1. https://vercel.com → **Add New → Project** → importa el repositorio.
2. Framework: Next.js (automático). En **Environment Variables** agrega:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy**. Abre la URL, ingresa con un usuario del paso 2.

## Cómo funciona
- Todo lo del calendario se guarda en la tabla `calendar_state` (un solo calendario compartido). Los cambios se guardan solos y la pantalla se refresca cada 15 s.
- Si dos personas editan a la vez, el servidor avisa del conflicto (409) y carga la versión más reciente.
- Los PDF (máx. 50 MB) van directo del navegador al bucket privado; se abren con enlaces temporales de 2 minutos.
- Todo requiere sesión; las rutas `/api/*` responden 401 sin ella.

## Límites conocidos
- Probado con un Supabase simulado; la primera prueba real es tu despliegue.
- El Excel usa la librería ExcelJS desde internet (CDN).
- Si editas `legacy/calendario.html`, `npm run build` regenera `lib/appHtml.js` automáticamente.
