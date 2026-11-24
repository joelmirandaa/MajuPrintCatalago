// Token de sessão assinado com HMAC (emitido após o Turnstile). Formato: <payload-b64url>.<assinatura-b64url>
import { createMiddleware } from 'hono/factory';
import type { AppEnv } from '../env';
import { deBase64Url, gerarIdAleatorio, paraBase64Url } from '../utils/ids';
import { ErroHttp } from '../utils/respostas';

export const DURACAO_SESSAO_MS = 2 * 60 * 60 * 1000;
/** Uma sessão renovada mantém o mesmo ID por até 24 h, para que as fotos do carrinho continuem válidas. */
const JANELA_RENOVACAO_MS = 24 * 60 * 60 * 1000;

interface CargaSessao {
  sid: string;
  /** Início da sessão original (ms). */
  ini: number;
  /** Expiração deste token (ms). */
  exp: number;
}

const codificador = new TextEncoder();

async function chave(segredo: string): Promise<CryptoKey> {
  if (!segredo || segredo.length < 16) throw new Error('SESSAO_SEGREDO ausente ou curto demais');
  return crypto.subtle.importKey('raw', codificador.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

export async function assinarSessao(segredo: string, carga: CargaSessao): Promise<string> {
  const corpo = paraBase64Url(codificador.encode(JSON.stringify(carga)));
  const assinatura = await crypto.subtle.sign('HMAC', await chave(segredo), codificador.encode(corpo));
  return `${corpo}.${paraBase64Url(new Uint8Array(assinatura))}`;
}

/** Verifica a assinatura. Não checa a expiração (quem chama decide). */
export async function lerSessao(segredo: string, token: string): Promise<CargaSessao | null> {
  const [corpo, assinatura, extra] = token.split('.');
  if (!corpo || !assinatura || extra !== undefined) return null;
  try {
    const ok = await crypto.subtle.verify(
      'HMAC',
      await chave(segredo),
      deBase64Url(assinatura),
      codificador.encode(corpo),
    );
    if (!ok) return null;
    const carga = JSON.parse(new TextDecoder().decode(deBase64Url(corpo))) as Partial<CargaSessao>;
    if (typeof carga.sid !== 'string' || typeof carga.exp !== 'number' || typeof carga.ini !== 'number') return null;
    return carga as CargaSessao;
  } catch {
    return null;
  }
}

/** Cria um novo token; reaproveita o ID da sessão anterior se ela for válida e recente. */
export async function emitirSessao(segredo: string, tokenAnterior: string | undefined, agora = Date.now()) {
  let sid = gerarIdAleatorio();
  let ini = agora;
  if (tokenAnterior) {
    const anterior = await lerSessao(segredo, tokenAnterior);
    if (anterior && agora - anterior.ini < JANELA_RENOVACAO_MS) {
      sid = anterior.sid;
      ini = anterior.ini;
    }
  }
  const exp = agora + DURACAO_SESSAO_MS;
  return { token: await assinarSessao(segredo, { sid, ini, exp }), expiraEm: exp };
}

/** Exige `Authorization: Bearer <token>` válido e não expirado. Define `sessaoId`. */
export const exigirSessao = createMiddleware<AppEnv>(async (c, next) => {
  const cabecalho = c.req.header('Authorization') ?? '';
  const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : '';
  const carga = token ? await lerSessao(c.env.SESSAO_SEGREDO, token) : null;
  if (!carga || carga.exp < Date.now()) {
    throw new ErroHttp(401, 'Sua sessão expirou. Tente novamente.');
  }
  c.set('sessaoId', carga.sid);
  await next();
});
