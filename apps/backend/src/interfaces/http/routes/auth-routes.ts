import type { FastifyInstance } from 'fastify';

/**
 * Auth routes. All require authentication (preHandler must be registered when mounting).
 */
export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/auth/me', async (request, reply) => {
    if (!request.user) {
      await reply.status(401).send({ error: 'Unauthorized' });
      return;
    }
    await reply.send({ user: { id: request.user.id, email: request.user.email } });
  });
}
