# Moyo

Infraestrutura inicial do projeto Moyo — uma plataforma em português brasileiro para profissionais de saúde mental gerenciarem documentos e coletarem assinaturas digitais de pacientes.

## Estrutura

- `apps/backend`: servidor Fastify com integrações futuras ao Supabase.
- `apps/frontend`: aplicação Next.js 14 com Tailwind CSS e tokens de cor da paleta oficial.
- `packages/shared`: espaço para tipagens e utilitários compartilhados entre backend e frontend.

## Scripts principais

```bash
npm run dev        # executa pipelines de desenvolvimento via Turborepo
npm run build      # constrói todos os workspaces
npm run lint       # lint em todos os pacotes
npm run type-check # checagem de tipos
```

## Próximos passos sugeridos

1. Configurar autenticação Supabase e variáveis de ambiente.
2. Implementar fluxos de upload/assinatura nos respectivos apps.
3. Adicionar testes e pipelines de CI.
