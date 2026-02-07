# Moyo

Initial infrastructure for the Moyo project — a platform for mental health professionals to manage documents and collect digital signatures from patients. The user interface is in Brazilian Portuguese.

## Structure

- `apps/backend`: Fastify server with Supabase Auth (clean architecture: domain, application, infrastructure, HTTP middleware).
- `apps/frontend`: Next.js 14 app with Tailwind CSS, Supabase Auth (browser/server/middleware clients), login/signup, and protected `/app` routes.
- `packages/shared`: Shared types (including `AuthUser`) and utilities used by both backend and frontend.

## Environment

Copy `.env.example` and set Supabase credentials:

- **Backend:** `SUPABASE_URL`, `SUPABASE_ANON_KEY` (required for JWT validation and `GET /auth/me`).
- **Frontend:** In `apps/frontend/.env.local`, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Get the URL and anon key from the [Supabase Dashboard](https://supabase.com/dashboard) → Project → Settings → API. Enable Email auth in Authentication → Providers if needed.

## Auth flow

1. **Frontend:** Users sign in or sign up at `/login` and `/signup` (Supabase Email auth). Session is stored in cookies and refreshed in Next.js middleware.
2. **Protected routes:** Paths under `/app` require authentication; unauthenticated users are redirected to `/login`. The `(app)` layout also checks the session server-side.
3. **Backend API:** Send `Authorization: Bearer <access_token>` (from the Supabase session) when calling protected endpoints. `GET /auth/me` returns the current user when the token is valid.

## Main scripts

```bash
npm run dev           # run backend and frontend (Turborepo)
npm run dev:backend   # run backend only
npm run dev:frontend  # run frontend only
npm run build        # build all workspaces
npm run lint         # lint all packages
npm run type-check   # type checking
```

To use Turbo filter directly: `npx turbo run dev --filter=@moyo/backend` or `--filter=@moyo/frontend`.
