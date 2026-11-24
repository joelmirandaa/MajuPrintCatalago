// Worker principal: API (Hono), imagens do catálogo e limpeza agendada.
// Os arquivos estáticos do React são servidos pelo binding de assets (wrangler.jsonc).
import { Hono } from 'hono';
import type { AppEnv, Env } from './env';
import { rotasAdmin } from './rotas/admin';
import { rotasImagens } from './rotas/imagens';
import { rotasPublicas } from './rotas/publico';
import { executarLimpeza } from './servicos/limpeza';
import { responderErro } from './utils/respostas';

const app = new Hono<AppEnv>();

app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});

app.route('/api/admin', rotasAdmin);
app.route('/api', rotasPublicas);
app.route('/img', rotasImagens);

app.notFound((c) => {
  if (c.req.path.startsWith('/api/') || c.req.path.startsWith('/img/')) {
    return c.json({ erro: 'Rota não encontrada' }, 404);
  }
  return c.env.ASSETS.fetch(c.req.raw);
});

app.onError((erro, c) => responderErro(c, erro));

export default {
  fetch: app.fetch,
  async scheduled(_evento, env, ctx) {
    ctx.waitUntil(
      executarLimpeza(env).then((r) => console.log('Limpeza concluída', JSON.stringify(r))),
    );
  },
} satisfies ExportedHandler<Env>;

export { app };
