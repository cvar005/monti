# Monti (app para fundadores)

Next.js 16 + Supabase + Claude. Gastos con foto del recibo, presupuesto por porcentaje, metas con plan semanal y metas compartidas en pareja.

## Puesta en marcha

1. **Supabase**: crea un proyecto en supabase.com. En *SQL Editor*, pega y ejecuta, en orden, `supabase/migrations/0001_init.sql` y `0002_goal_guests.sql`.
2. En Supabase → *Authentication → URL Configuration*:
   - *Site URL*: la URL de la app (local: `http://localhost:3000`).
   - *Redirect URLs*: agrega `http://localhost:3000/auth/callback` y `https://TU-DOMINIO/auth/callback`.
3. **Correo con código**: en Supabase → *Authentication → Emails → Magic Link*, cambia el asunto y el cuerpo para que incluyan el código:
   - Asunto: `Tu código para entrar a Monti`
   - Cuerpo: `<h2>Tu código es {{ .Token }}</h2><p>Escríbelo en Monti para entrar. Vence en 1 hora.</p>`
   Sin `{{ .Token }}` el correo solo trae el link y en iPhone abre Safari en vez de la app instalada.
4. **Claude**: crea una API key en console.anthropic.com.
5. Copia `.env.example` a `.env.local` y llena las tres variables.
6. `npm install` y luego `npm run dev`. Abre http://localhost:3000.

## Publicar (Vercel)

1. Sube la carpeta a un repositorio de GitHub e impórtalo en vercel.com.
2. En *Settings → Environment Variables* agrega las mismas tres variables.
3. Agrega la URL de Vercel en las *Redirect URLs* de Supabase.

## Cómo está armado

- `src/app/(app)/`: pantallas con sesión (inicio, presupuesto, agregar, metas, gastos, ajustes).
- `src/app/api/scan/route.ts`: recibe la foto, la guarda en Storage y la lee con Claude.
- `src/lib/receipt.ts`: lectura del recibo. Usa `claude-haiku-5-5` y pasa a `claude-sonnet-5-5` solo si la confianza es menor a 80%.
- `src/app/actions.ts`: todas las escrituras (gastos, reglas, presupuesto, metas, aportes, invitaciones).
- `supabase/migrations/0001_init.sql`: tablas, reglas de acceso (RLS) y funciones para metas compartidas.
