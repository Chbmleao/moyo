import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from 'dotenv';

config();

const app = Fastify({
  logger: true,
});

app.register(cors, {
    origin: true,
});

app.get('/health', async () => ({ status: 'ok' }));

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
