import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from 'dotenv';
import { createSupabaseAuthRepository } from './infrastructure/auth/supabase-auth-repository.js';
import { makeGetCurrentUser } from './application/use-cases/get-current-user.js';
import { createAuthPreHandler } from './interfaces/http/middleware/auth.js';
import { registerAuthRoutes } from './interfaces/http/routes/auth-routes.js';

config();

const authRepository = createSupabaseAuthRepository();
const getCurrentUser = makeGetCurrentUser(authRepository);
const authPreHandler = createAuthPreHandler(getCurrentUser);

const app = Fastify({
  logger: true,
});

app.register(cors, {
  origin: true,
});

app.get('/health', async () => ({ status: 'ok' }));

app.register(async (protectedScope) => {
  protectedScope.addHook('preHandler', authPreHandler);
  await protectedScope.register(registerAuthRoutes);
});

const port = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? '0.0.0.0';

async function start() {
  try {
    await app.listen({ port, host });
    app.log.info(`Moyo backend listening on http://${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
