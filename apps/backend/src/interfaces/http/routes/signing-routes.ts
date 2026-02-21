import type { FastifyInstance } from 'fastify';
import type { GetDocumentByToken } from '../../../application/use-cases/get-document-by-token.js';
import type { SignDocument } from '../../../application/use-cases/sign-document.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function registerSigningRoutes(
  app: FastifyInstance,
  deps: {
    getDocumentByToken: GetDocumentByToken;
    signDocument: SignDocument;
  },
): void {
  // GET /signing/:token — public: view document metadata + file URL
  app.get<{ Params: { token: string } }>('/signing/:token', async (request, reply) => {
    const { token } = request.params;

    if (!UUID_REGEX.test(token)) {
      await reply.status(400).send({ error: 'Bad Request', message: 'Invalid token format' });
      return;
    }

    try {
      const result = await deps.getDocumentByToken(token);
      await reply.send({
        document: {
          id: result.document.id,
          fileName: result.document.fileName,
          signerEmail: result.document.signerEmail,
          deadlineAt: result.document.deadlineAt?.toISOString() ?? null,
          status: result.document.status,
          signedAt: result.document.signedAt?.toISOString() ?? null,
        },
        viewUrl: result.viewUrl,
      });
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode ?? 500;
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      await reply.status(statusCode).send({ error: message });
    }
  });

  // POST /signing/:token/sign — public: sign the document
  app.post<{ Params: { token: string } }>('/signing/:token/sign', async (request, reply) => {
    const { token } = request.params;

    if (!UUID_REGEX.test(token)) {
      await reply.status(400).send({ error: 'Bad Request', message: 'Invalid token format' });
      return;
    }

    try {
      const result = await deps.signDocument(token);
      await reply.send(result);
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode ?? 500;
      const message = err instanceof Error ? err.message : 'Internal Server Error';
      await reply.status(statusCode).send({ error: message });
    }
  });
}
