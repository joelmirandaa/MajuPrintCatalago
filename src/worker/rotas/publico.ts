// Rotas públicas: catálogo, sessão (Turnstile), upload de fotos e criação de pedidos.
import { Hono } from 'hono';
import { and, count, eq } from 'drizzle-orm';
import { LIMITES, esquemaPedido, esquemaSessao } from '../../compartilhado/esquemas';
import type { AppEnv } from '../env';
import { criarDb, schema } from '../db/client';
import { emitirSessao, exigirSessao } from '../middlewares/sessao';
import { catalogoPublico } from '../servicos/catalogo';
import { criarPedido } from '../servicos/pedidos';
import { validarTurnstile } from '../servicos/turnstile';
import { gerarIdAleatorio, sanitizarNomeArquivo } from '../utils/ids';
import { ErroHttp } from '../utils/respostas';
import { lerJson } from '../utils/validacao';

/** Evita abuso: máximo de fotos pendentes (ainda não vinculadas a pedido) por sessão. */
const MAX_UPLOADS_PENDENTES = 40;

export const rotasPublicas = new Hono<AppEnv>();

rotasPublicas.get('/catalogo', async (c) => {
  const dados = await catalogoPublico(criarDb(c.env.DB), c.env.TURNSTILE_SITE_KEY);
  c.header('Cache-Control', 'public, max-age=60');
  return c.json(dados);
});

rotasPublicas.post('/sessao', async (c) => {
  const { turnstileToken, tokenAnterior } = await lerJson(c, esquemaSessao);
  const ok = await validarTurnstile(c.env.TURNSTILE_SECRET, turnstileToken, c.req.header('CF-Connecting-IP'));
  if (!ok) throw new ErroHttp(403, 'Não foi possível confirmar que você não é um robô. Tente novamente.');
  return c.json(await emitirSessao(c.env.SESSAO_SEGREDO, tokenAnterior));
});

function inteiroOuNulo(valor: string | undefined): number | null {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 && n < 100_000 ? n : null;
}

rotasPublicas.post('/uploads', exigirSessao, async (c) => {
  const sessao = c.get('sessaoId');
  const tipo = (c.req.header('Content-Type') ?? '').split(';')[0]!.trim().toLowerCase();
  const tamanho = Number(c.req.header('Content-Length'));
  if (!(LIMITES.tiposFoto as readonly string[]).includes(tipo)) {
    throw new ErroHttp(415, 'Formato não aceito. Envie JPG, PNG, HEIC ou WEBP.');
  }
  if (!Number.isFinite(tamanho) || tamanho <= 0) throw new ErroHttp(411, 'Tamanho do arquivo não informado');
  if (tamanho > LIMITES.bytesPorFoto) throw new ErroHttp(413, 'A foto passa de 25 MB. Escolha um arquivo menor.');
  if (!c.req.raw.body) throw new ErroHttp(400, 'Arquivo vazio');

  const db = criarDb(c.env.DB);
  const [pendentes] = await db.select({ n: count() }).from(schema.uploads).where(eq(schema.uploads.sessao, sessao));
  if ((pendentes?.n ?? 0) >= MAX_UPLOADS_PENDENTES) {
    throw new ErroHttp(429, 'Muitas fotos enviadas. Finalize o pedido ou remova algumas fotos.');
  }

  let nomeOriginal = 'foto';
  try {
    nomeOriginal = decodeURIComponent(c.req.header('X-Nome-Arquivo') ?? 'foto').slice(0, 200);
  } catch {
    /* nome inválido: mantém o padrão */
  }
  const id = gerarIdAleatorio();
  const chave = `pedidos/${crypto.randomUUID()}/${sanitizarNomeArquivo(nomeOriginal)}`;

  // Streaming direto para o R2: o arquivo original não é carregado em memória nem alterado.
  const objeto = await c.env.FOTOS.put(chave, c.req.raw.body, { httpMetadata: { contentType: tipo } });
  if (!objeto || objeto.size > LIMITES.bytesPorFoto) {
    await c.env.FOTOS.delete(chave);
    throw new ErroHttp(413, 'A foto passa de 25 MB. Escolha um arquivo menor.');
  }

  await db.insert(schema.uploads).values({
    id,
    r2Key: chave,
    sessao,
    nomeOriginal,
    tipoMime: tipo,
    bytes: objeto.size,
    largura: inteiroOuNulo(c.req.header('X-Largura')),
    altura: inteiroOuNulo(c.req.header('X-Altura')),
    criadoEm: Date.now(),
  });
  return c.json({ uploadId: id }, 201);
});

rotasPublicas.delete('/uploads/:id', exigirSessao, async (c) => {
  const db = criarDb(c.env.DB);
  const id = c.req.param('id');
  const filtro = and(eq(schema.uploads.id, id), eq(schema.uploads.sessao, c.get('sessaoId')));
  const [upload] = await db.select({ chave: schema.uploads.r2Key }).from(schema.uploads).where(filtro);
  if (!upload) return c.json({ ok: true }); // já removido: operação idempotente
  await c.env.FOTOS.delete(upload.chave);
  await db.delete(schema.uploads).where(filtro);
  return c.json({ ok: true });
});

rotasPublicas.post('/pedidos', exigirSessao, async (c) => {
  const entrada = await lerJson(c, esquemaPedido);
  const origem = new URL(c.req.url).origin;
  const resultado = await criarPedido(c.env, c.get('sessaoId'), entrada, origem);
  return c.json(resultado, 201);
});
