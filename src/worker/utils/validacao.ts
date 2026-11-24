import type { Context } from 'hono';
import type { z } from 'zod';
import { ErroHttp, erroValidacao } from './respostas';

/** Lê o corpo JSON e valida com Zod; lança ErroHttp 400 em caso de erro. */
export async function lerJson<T extends z.ZodType>(c: Context, esquema: T): Promise<z.infer<T>> {
  let corpo: unknown;
  try {
    corpo = await c.req.json();
  } catch {
    throw new ErroHttp(400, 'Corpo da requisição inválido');
  }
  const r = esquema.safeParse(corpo);
  if (!r.success) throw erroValidacao(r.error);
  return r.data;
}

export function lerIdParam(c: Context, nome = 'id'): number {
  const n = Number(c.req.param(nome));
  if (!Number.isInteger(n) || n <= 0) throw new ErroHttp(400, 'ID inválido');
  return n;
}
