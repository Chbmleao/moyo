import type { FastifyInstance } from 'fastify';

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/auth/me', async (request, reply) => {
    if (!request.user) {
      await reply.status(401).send({ error: 'Unauthorized' });
      return;
    }
    await reply.send({
        user: {
          id: request.user.id,
          email: request.user.email,
          role: request.user.role,
        },
      });
  });
}
