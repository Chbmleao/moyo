import type { User } from '../domain/entities/user.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: User;
  }
}
