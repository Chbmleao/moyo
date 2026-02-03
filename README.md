# Moyo

Initial infrastructure for the Moyo project — a platform for mental health professionals to manage documents and collect digital signatures from patients. The user interface is in Brazilian Portuguese.

## Structure

- `apps/backend`: Fastify server with planned Supabase integrations.
- `apps/frontend`: Next.js 14 app with Tailwind CSS and official palette color tokens.
- `packages/shared`: Shared types and utilities used by both backend and frontend.

## Main scripts

```bash
npm run dev        # run development pipelines via Turborepo
npm run build      # build all workspaces
npm run lint       # lint all packages
npm run type-check # type checking
```
