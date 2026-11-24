// Rotas do painel (protegidas pelo Cloudflare Access + middleware exigirAdmin).
import { Hono } from 'hono';
import { asc, count, desc, eq, inArray, sql } from 'drizzle-orm';
import {
  esquemaCategoria,
  esquemaConfig,
  esquemaModelo,
  esquemaOrdemModelos,
  esquemaPapel,
  esquemaPrecos,
  esquemaStatus,
  esquemaTamanho,
} from '../../compartilhado/esquemas';
import type {
  FotoPedido,
  ItemPedido,
  ListaPedidosResposta,
  PedidoCompleto,
  StatusPedido,
} from '../../compartilhado/tipos';
import type { AppEnv } from '../env';
import { criarDb, schema } from '../db/client';
import { exigirAdmin } from '../middlewares/access';
import { catalogoAdmin } from '../servicos/catalogo';
import { lerConfig } from '../servicos/config';
import { sanitizarNomeArquivo } from '../utils/ids';
import { ErroHttp } from '../utils/respostas';
import { lerIdParam, lerJson } from '../utils/validacao';

const POR_PAGINA = 20;
const PRAZO_APAGAR_MS = 24 * 60 * 60 * 1000;
const STATUS: StatusPedido[] = ['novo', 'confirmado', 'producao', 'entregue', 'cancelado'];

export const rotasAdmin = new Hono<AppEnv>();
rotasAdmin.use('*', exigirAdmin);

rotasAdmin.get('/eu', (c) => c.json({ email: c.get('emailAdmin') }));

// ---------- Pedidos ----------

rotasAdmin.get('/pedidos', async (c) => {
  const db = criarDb(c.env.DB);
  const statusParam = c.req.query('status') as StatusPedido | undefined;
  const pagina = Math.max(1, Number(c.req.query('pagina')) || 1);
  if (statusParam && !STATUS.includes(statusParam)) throw new ErroHttp(400, 'Status inválido');
  const linhas = await db
    .select({
      codigo: schema.pedidos.codigo,
      nome: schema.pedidos.nome,
      status: schema.pedidos.status,
      subtotalCentavos: schema.pedidos.subtotalCentavos,
      temPersonalizado: schema.pedidos.temPersonalizado,
      criadoEm: schema.pedidos.criadoEm,
    })
    .from(schema.pedidos)
    .where(statusParam ? eq(schema.pedidos.status, statusParam) : undefined)
    .orderBy(desc(schema.pedidos.criadoEm))
    .limit(POR_PAGINA + 1)
    .offset((pagina - 1) * POR_PAGINA);
  const resposta: ListaPedidosResposta = {
    pedidos: linhas.slice(0, POR_PAGINA),
    pagina,
    temMais: linhas.length > POR_PAGINA,
  };
  return c.json(resposta);
});

rotasAdmin.get('/pedidos/contagem', async (c) => {
  const db = criarDb(c.env.DB);
  const linhas = await db
    .select({ status: schema.pedidos.status, n: count() })
    .from(schema.pedidos)
    .groupBy(schema.pedidos.status);
  return c.json(Object.fromEntries(linhas.map((l) => [l.status, l.n])));
});

async function carregarPedido(db: ReturnType<typeof criarDb>, codigo: string): Promise<PedidoCompleto> {
  const [pedido] = await db.select().from(schema.pedidos).where(eq(schema.pedidos.codigo, codigo));
  if (!pedido) throw new ErroHttp(404, 'Pedido não encontrado. Ele pode ter sido apagado.');
  const [itens, fotos] = await db.batch([
    db.select().from(schema.itens).where(eq(schema.itens.pedidoId, pedido.id)).orderBy(asc(schema.itens.id)),
    db
      .select({
        id: schema.fotos.id,
        itemId: schema.fotos.itemId,
        funcao: schema.fotos.funcao,
        nomeOriginal: schema.fotos.nomeOriginal,
        tipoMime: schema.fotos.tipoMime,
        bytes: schema.fotos.bytes,
        largura: schema.fotos.largura,
        altura: schema.fotos.altura,
      })
      .from(schema.fotos)
      .innerJoin(schema.itens, eq(schema.fotos.itemId, schema.itens.id))
      .where(eq(schema.itens.pedidoId, pedido.id))
      .orderBy(asc(schema.fotos.id)),
  ]);
  const fotosPorItem = new Map<number, FotoPedido[]>();
  for (const f of fotos) fotosPorItem.set(f.itemId, [...(fotosPorItem.get(f.itemId) ?? []), f]);
  const itensCompletos: ItemPedido[] = itens.map(({ pedidoId: _p, ...i }) => ({
    ...i,
    fotos: fotosPorItem.get(i.id) ?? [],
  }));
  const { id: _id, ...dados } = pedido;
  return { ...dados, itens: itensCompletos };
}

rotasAdmin.get('/pedidos/:codigo', async (c) => {
  return c.json(await carregarPedido(criarDb(c.env.DB), c.req.param('codigo')));
});

rotasAdmin.patch('/pedidos/:codigo', async (c) => {
  const db = criarDb(c.env.DB);
  const { status } = await lerJson(c, esquemaStatus);
  const agora = Date.now();
  const finaliza = status === 'entregue' || status === 'cancelado';
  const atualizados = await db
    .update(schema.pedidos)
    .set({
      status,
      atualizadoEm: agora,
      apagarEm: finaliza ? agora + PRAZO_APAGAR_MS : null,
      entregueEm: status === 'entregue' ? agora : null,
    })
    .where(eq(schema.pedidos.codigo, c.req.param('codigo')))
    .returning({ id: schema.pedidos.id });
  if (atualizados.length === 0) throw new ErroHttp(404, 'Pedido não encontrado');
  return c.json(await carregarPedido(db, c.req.param('codigo')));
});

rotasAdmin.get('/fotos/:id', async (c) => {
  const db = criarDb(c.env.DB);
  const [foto] = await db
    .select({
      chave: schema.fotos.r2Key,
      nome: schema.fotos.nomeOriginal,
      itemId: schema.fotos.itemId,
      codigo: schema.pedidos.codigo,
    })
    .from(schema.fotos)
    .innerJoin(schema.itens, eq(schema.fotos.itemId, schema.itens.id))
    .innerJoin(schema.pedidos, eq(schema.itens.pedidoId, schema.pedidos.id))
    .where(eq(schema.fotos.id, lerIdParam(c)));
  if (!foto) throw new ErroHttp(404, 'Foto não encontrada');
  const objeto = await c.env.FOTOS.get(foto.chave);
  if (!objeto) throw new ErroHttp(404, 'Arquivo não encontrado no armazenamento');
  const cabecalhos = new Headers();
  objeto.writeHttpMetadata(cabecalhos);
  cabecalhos.set('Content-Length', String(objeto.size));
  cabecalhos.set('Cache-Control', 'private, no-store');
  if (c.req.query('inline') !== '1') {
    const nome = sanitizarNomeArquivo(`${foto.codigo}_${foto.itemId}_${foto.nome ?? 'foto'}`);
    cabecalhos.set('Content-Disposition', `attachment; filename="${nome}"`);
  }
  return new Response(objeto.body, { headers: cabecalhos });
});

// ---------- Catálogo ----------

rotasAdmin.get('/catalogo', async (c) => c.json(await catalogoAdmin(criarDb(c.env.DB))));

rotasAdmin.post('/categorias', async (c) => {
  const dados = await lerJson(c, esquemaCategoria);
  const [nova] = await criarDb(c.env.DB).insert(schema.categorias).values(dados).returning();
  return c.json(nova, 201);
});

rotasAdmin.put('/categorias/:id', async (c) => {
  const dados = await lerJson(c, esquemaCategoria);
  const [atual] = await criarDb(c.env.DB)
    .update(schema.categorias)
    .set(dados)
    .where(eq(schema.categorias.id, lerIdParam(c)))
    .returning();
  if (!atual) throw new ErroHttp(404, 'Categoria não encontrada');
  return c.json(atual);
});

rotasAdmin.delete('/categorias/:id', async (c) => {
  const db = criarDb(c.env.DB);
  const id = lerIdParam(c);
  const [uso] = await db.select({ n: count() }).from(schema.modelos).where(eq(schema.modelos.categoriaId, id));
  if ((uso?.n ?? 0) > 0) {
    throw new ErroHttp(409, 'Existem modelos nesta categoria. Mova os modelos ou desative a categoria.');
  }
  await db.delete(schema.categorias).where(eq(schema.categorias.id, id));
  return c.json({ ok: true });
});

rotasAdmin.post('/modelos', async (c) => {
  const dados = await lerJson(c, esquemaModelo);
  const [novo] = await criarDb(c.env.DB)
    .insert(schema.modelos)
    .values({ ...dados, descricao: dados.descricao ?? null, criadoEm: Date.now() })
    .returning();
  return c.json(novo, 201);
});

rotasAdmin.put('/modelos/ordem', async (c) => {
  const { ids } = await lerJson(c, esquemaOrdemModelos);
  if (ids.length === 0) return c.json({ ok: true });
  // UPDATE com CASE em blocos de 45 IDs (limite de 100 parâmetros por consulta no D1).
  const db = criarDb(c.env.DB);
  for (let i = 0; i < ids.length; i += 45) {
    const parte = ids.slice(i, i + 45);
    const casosParte = sql.join(
      parte.map((id, j) => sql`WHEN ${id} THEN ${i + j}`),
      sql` `,
    );
    await db
      .update(schema.modelos)
      .set({ ordem: sql`CASE ${schema.modelos.id} ${casosParte} END` })
      .where(inArray(schema.modelos.id, parte));
  }
  return c.json({ ok: true });
});

rotasAdmin.put('/modelos/:id', async (c) => {
  const dados = await lerJson(c, esquemaModelo);
  const [atual] = await criarDb(c.env.DB)
    .update(schema.modelos)
    .set({ ...dados, descricao: dados.descricao ?? null })
    .where(eq(schema.modelos.id, lerIdParam(c)))
    .returning();
  if (!atual) throw new ErroHttp(404, 'Modelo não encontrado');
  return c.json(atual);
});

rotasAdmin.put('/modelos/:id/imagem', async (c) => {
  const db = criarDb(c.env.DB);
  const id = lerIdParam(c);
  if ((c.req.header('Content-Type') ?? '') !== 'image/webp') {
    throw new ErroHttp(415, 'A imagem do modelo deve ser enviada em WebP');
  }
  const tamanho = Number(c.req.header('Content-Length'));
  if (!Number.isFinite(tamanho) || tamanho <= 0 || tamanho > 5 * 1024 * 1024) {
    throw new ErroHttp(413, 'Imagem muito grande (máximo 5 MB)');
  }
  const [modelo] = await db
    .select({ imagemKey: schema.modelos.imagemKey })
    .from(schema.modelos)
    .where(eq(schema.modelos.id, id));
  if (!modelo) throw new ErroHttp(404, 'Modelo não encontrado');
  if (!c.req.raw.body) throw new ErroHttp(400, 'Imagem vazia');
  const chave = `catalogo/${crypto.randomUUID()}.webp`;
  await c.env.FOTOS.put(chave, c.req.raw.body, { httpMetadata: { contentType: 'image/webp' } });
  const [atual] = await db
    .update(schema.modelos)
    .set({ imagemKey: chave })
    .where(eq(schema.modelos.id, id))
    .returning();
  if (modelo.imagemKey) await c.env.FOTOS.delete(modelo.imagemKey);
  return c.json(atual);
});

rotasAdmin.delete('/modelos/:id', async (c) => {
  const db = criarDb(c.env.DB);
  const id = lerIdParam(c);
  const [modelo] = await db
    .select({ imagemKey: schema.modelos.imagemKey })
    .from(schema.modelos)
    .where(eq(schema.modelos.id, id));
  if (!modelo) throw new ErroHttp(404, 'Modelo não encontrado');
  // Itens de pedidos guardam cópia do nome, então o modelo pode ser apagado com segurança.
  await db.batch([
    db.delete(schema.precos).where(eq(schema.precos.modeloId, id)),
    db.delete(schema.modelos).where(eq(schema.modelos.id, id)),
  ]);
  if (modelo.imagemKey) await c.env.FOTOS.delete(modelo.imagemKey);
  return c.json({ ok: true });
});

rotasAdmin.post('/tamanhos', async (c) => {
  const dados = await lerJson(c, esquemaTamanho);
  const [novo] = await criarDb(c.env.DB).insert(schema.tamanhos).values(dados).returning();
  return c.json(novo, 201);
});

rotasAdmin.put('/tamanhos/:id', async (c) => {
  const dados = await lerJson(c, esquemaTamanho);
  const [atual] = await criarDb(c.env.DB)
    .update(schema.tamanhos)
    .set(dados)
    .where(eq(schema.tamanhos.id, lerIdParam(c)))
    .returning();
  if (!atual) throw new ErroHttp(404, 'Tamanho não encontrado');
  return c.json(atual);
});

rotasAdmin.delete('/tamanhos/:id', async (c) => {
  const db = criarDb(c.env.DB);
  const id = lerIdParam(c);
  await db.batch([
    db.delete(schema.precos).where(eq(schema.precos.tamanhoId, id)),
    db.delete(schema.tamanhos).where(eq(schema.tamanhos.id, id)),
  ]);
  return c.json({ ok: true });
});

rotasAdmin.post('/papeis', async (c) => {
  const dados = await lerJson(c, esquemaPapel);
  const [novo] = await criarDb(c.env.DB).insert(schema.papeis).values(dados).returning();
  return c.json(novo, 201);
});

rotasAdmin.put('/papeis/:id', async (c) => {
  const dados = await lerJson(c, esquemaPapel);
  const [atual] = await criarDb(c.env.DB)
    .update(schema.papeis)
    .set(dados)
    .where(eq(schema.papeis.id, lerIdParam(c)))
    .returning();
  if (!atual) throw new ErroHttp(404, 'Papel não encontrado');
  return c.json(atual);
});

rotasAdmin.delete('/papeis/:id', async (c) => {
  const db = criarDb(c.env.DB);
  const id = lerIdParam(c);
  await db.batch([
    db.delete(schema.precos).where(eq(schema.precos.papelId, id)),
    db.delete(schema.papeis).where(eq(schema.papeis.id, id)),
  ]);
  return c.json({ ok: true });
});

/** Substitui a tabela de preços inteira de uma vez, em uma única transação (batch). */
rotasAdmin.put('/precos', async (c) => {
  const { precos } = await lerJson(c, esquemaPrecos);
  const chaves = new Set<string>();
  for (const p of precos) {
    const chave = `${p.modeloId ?? 'base'}:${p.tamanhoId}:${p.papelId}`;
    if (chaves.has(chave)) throw new ErroHttp(400, 'Preço duplicado para a mesma combinação');
    chaves.add(chave);
  }
  const db = criarDb(c.env.DB);
  // D1 aceita até 100 parâmetros por consulta: 4 colunas × 24 linhas = 96.
  const insercoes = [];
  for (let i = 0; i < precos.length; i += 24) {
    insercoes.push(db.insert(schema.precos).values(precos.slice(i, i + 24)));
  }
  await db.batch([db.delete(schema.precos), ...insercoes]);
  return c.json({ ok: true });
});

rotasAdmin.get('/config', async (c) => c.json(await lerConfig(criarDb(c.env.DB))));

rotasAdmin.put('/config', async (c) => {
  const dados = await lerJson(c, esquemaConfig);
  const db = criarDb(c.env.DB);
  const linhas = Object.entries(dados).map(([chave, valor]) => ({ chave, valor }));
  await db
    .insert(schema.config)
    .values(linhas)
    .onConflictDoUpdate({ target: schema.config.chave, set: { valor: sql`excluded.valor` } });
  return c.json(await lerConfig(db));
});
