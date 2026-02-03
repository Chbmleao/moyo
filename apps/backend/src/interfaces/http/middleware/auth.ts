import type { FastifyRequest, FastifyReply } from 'fastify';
import type { GetCurrentUser } from '../../../application/use-cases/get-current-user.js';

const BEARER_PREFIX = 'Bearer ';

function extractToken(authorization: string | undefined): string | null {
  if (!authorization || !authorization.startsWith(BEARER_PREFIX)) {
    return null;
  }
  return authorization.slice(BEARER_PREFIX.length).trim() || null;
}

export function createAuthPreHandler(getCurrentUser: GetCurrentUser) {
  return async function authPreHandler(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    const token = extractToken(request.headers.authorization);
    if (!token) {
      await reply.status(401).send({ error: 'Unauthorized', message: 'Missing or invalid Authorization header' });
      return;
    }

    const user = await getCurrentUser(token);
    if (!user) {
      await reply.status(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
      return;
    }

    request.user = user;
  };
}
