import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { ZodError } from 'zod';

export class ErroHttp extends Error {
  constructor(
    public readonly status: ContentfulStatusCode,
    mensagem: string,
    public readonly detalhes?: unknown,
  ) {
    super(mensagem);
  }
}

export function erroValidacao(erro: ZodError): ErroHttp {
  const primeira = erro.issues[0];
  return new ErroHttp(400, primeira?.message ?? 'Dados inválidos', erro.issues.map((i) => ({
    caminho: i.path.join('.'),
    mensagem: i.message,
  })));
}

export function responderErro(c: Context, erro: unknown) {
  if (erro instanceof ErroHttp) {
    return c.json({ erro: erro.message, detalhes: erro.detalhes }, erro.status);
  }
  console.error('Erro inesperado', erro);
  return c.json({ erro: 'Erro interno. Tente novamente em instantes.' }, 500);
}
