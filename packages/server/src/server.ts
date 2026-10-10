import { buildApp } from './app.ts';

const port = Number.parseInt(process.env['PORT'] ?? '3000', 10);
const host = process.env['HOST'] ?? '127.0.0.1';

const app = buildApp({ logger: true });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    app.close().then(
      () => process.exit(0),
      () => process.exit(1),
    );
  });
}

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
