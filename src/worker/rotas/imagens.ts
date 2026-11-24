// Imagens públicas do catálogo (somente o prefixo catalogo/), com cache longo.
import { Hono } from 'hono';
import type { AppEnv } from '../env';

export const rotasImagens = new Hono<AppEnv>();

rotasImagens.get('/catalogo/:arquivo{[A-Za-z0-9-]+\\.webp}', async (c) => {
  const chave = `catalogo/${c.req.param('arquivo')}`;
  const objeto = await c.env.FOTOS.get(chave);
  if (!objeto) return c.json({ erro: 'Imagem não encontrada' }, 404);
  const cabecalhos = new Headers();
  objeto.writeHttpMetadata(cabecalhos);
  cabecalhos.set('ETag', objeto.httpEtag);
  cabecalhos.set('Cache-Control', 'public, max-age=31536000, immutable');
  return new Response(objeto.body, { headers: cabecalhos });
});
