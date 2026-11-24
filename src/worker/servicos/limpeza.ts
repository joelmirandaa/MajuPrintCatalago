// Limpeza automática (Cron de hora em hora) — estrutura.md, seção 8.
// Trabalha em lotes pequenos para caber no limite de CPU/subrequisições do plano gratuito.
import { and, eq, inArray, isNotNull, lte, or } from 'drizzle-orm';
import type { Env } from '../env';
import { criarDb, schema } from '../db/client';

const LOTE_PEDIDOS = 20;
const LOTE_UPLOADS = 100;
const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

export interface ResultadoLimpeza {
  pedidosApagados: number;
  uploadsApagados: number;
  arquivosApagados: number;
}

/** Remove chaves do R2 em blocos (o delete aceita até 1000 chaves por chamada). */
async function apagarArquivos(fotos: R2Bucket, chaves: string[]): Promise<void> {
  for (let i = 0; i < chaves.length; i += 1000) {
    await fotos.delete(chaves.slice(i, i + 1000));
  }
}

/** Apaga pedidos (fotos no R2 primeiro, depois o D1 — itens e fotos saem em cascata). */
export async function apagarPedidos(env: Env, pedidoIds: number[]): Promise<number> {
  if (pedidoIds.length === 0) return 0;
  const db = criarDb(env.DB);
  const linhas = await db
    .select({ chave: schema.fotos.r2Key })
    .from(schema.fotos)
    .innerJoin(schema.itens, eq(schema.fotos.itemId, schema.itens.id))
    .where(inArray(schema.itens.pedidoId, pedidoIds));
  const chaves = linhas.map((l) => l.chave);
  await apagarArquivos(env.FOTOS, chaves);
  await db.delete(schema.pedidos).where(inArray(schema.pedidos.id, pedidoIds));
  return chaves.length;
}

export async function executarLimpeza(env: Env, agora = Date.now()): Promise<ResultadoLimpeza> {
  const db = criarDb(env.DB);

  // 1 e 3: pedidos vencidos (apagar_em) e pedidos "novo" esquecidos há mais de 15 dias.
  const vencidos = await db
    .select({ id: schema.pedidos.id })
    .from(schema.pedidos)
    .where(
      or(
        and(isNotNull(schema.pedidos.apagarEm), lte(schema.pedidos.apagarEm, agora)),
        and(eq(schema.pedidos.status, 'novo'), lte(schema.pedidos.criadoEm, agora - 15 * DIA)),
      ),
    )
    .limit(LOTE_PEDIDOS);
  const idsPedidos = vencidos.map((p) => p.id);
  let arquivos = await apagarPedidos(env, idsPedidos);

  // 2: uploads abandonados há mais de 24 h.
  const abandonados = await db
    .select({ id: schema.uploads.id, chave: schema.uploads.r2Key })
    .from(schema.uploads)
    .where(lte(schema.uploads.criadoEm, agora - DIA))
    .limit(LOTE_UPLOADS);
  if (abandonados.length > 0) {
    await apagarArquivos(
      env.FOTOS,
      abandonados.map((u) => u.chave),
    );
    await db.delete(schema.uploads).where(
      inArray(
        schema.uploads.id,
        abandonados.map((u) => u.id),
      ),
    );
    arquivos += abandonados.length;
  }

  return { pedidosApagados: idsPedidos.length, uploadsApagados: abandonados.length, arquivosApagados: arquivos };
}
