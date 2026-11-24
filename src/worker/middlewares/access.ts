// Valida o JWT do Cloudflare Access (cabeçalho Cf-Access-Jwt-Assertion): assinatura RS256, aud, iss e exp.
// Nunca confiar apenas na configuração do painel (estrutura.md, seção 11).
import { createMiddleware } from 'hono/factory';
import type { AppEnv, Env } from '../env';
import { deBase64Url } from '../utils/ids';
import { ErroHttp } from '../utils/respostas';

interface ChavePublica extends JsonWebKey {
  kid: string;
}

interface CacheChaves {
  dominio: string;
  chaves: Map<string, CryptoKey>;
  validoAte: number;
}

let cache: CacheChaves | null = null;

async function obterChaves(dominio: string): Promise<Map<string, CryptoKey>> {
  if (cache && cache.dominio === dominio && cache.validoAte > Date.now()) return cache.chaves;
  const resposta = await fetch(`https://${dominio}/cdn-cgi/access/certs`);
  if (!resposta.ok) throw new ErroHttp(503, 'Não foi possível validar o acesso agora');
  const { keys } = (await resposta.json()) as { keys: ChavePublica[] };
  const chaves = new Map<string, CryptoKey>();
  for (const jwk of keys) {
    const chave = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    chaves.set(jwk.kid, chave);
  }
  cache = { dominio, chaves, validoAte: Date.now() + 60 * 60 * 1000 };
  return chaves;
}

interface CargaAccess {
  aud?: string | string[];
  iss?: string;
  exp?: number;
  nbf?: number;
  email?: string;
}

export async function validarJwtAccess(token: string, env: Pick<Env, 'ACCESS_AUD' | 'ACCESS_TEAM_DOMAIN'>) {
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  const [cab64, carga64, assinatura64] = partes as [string, string, string];
  const decodificar = <T>(s: string) => JSON.parse(new TextDecoder().decode(deBase64Url(s))) as T;
  let cabecalho: { alg?: string; kid?: string };
  let carga: CargaAccess;
  try {
    cabecalho = decodificar(cab64);
    carga = decodificar(carga64);
  } catch {
    return null;
  }
  if (cabecalho.alg !== 'RS256' || !cabecalho.kid) return null;
  const chave = (await obterChaves(env.ACCESS_TEAM_DOMAIN)).get(cabecalho.kid);
  if (!chave) return null;
  const valido = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    chave,
    deBase64Url(assinatura64),
    new TextEncoder().encode(`${cab64}.${carga64}`),
  );
  if (!valido) return null;
  const agora = Math.floor(Date.now() / 1000);
  const auds = Array.isArray(carga.aud) ? carga.aud : [carga.aud];
  if (!auds.includes(env.ACCESS_AUD)) return null;
  if (carga.iss !== `https://${env.ACCESS_TEAM_DOMAIN}`) return null;
  if (typeof carga.exp !== 'number' || carga.exp < agora) return null;
  if (typeof carga.nbf === 'number' && carga.nbf > agora + 60) return null;
  return carga;
}

function ehLocal(url: string): boolean {
  const host = new URL(url).hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

export const exigirAdmin = createMiddleware<AppEnv>(async (c, next) => {
  // Atalho de desenvolvimento: só funciona com ADMIN_DEV_LIVRE=1 **e** acessando por localhost.
  if (c.env.ADMIN_DEV_LIVRE === '1' && ehLocal(c.req.url)) {
    c.set('emailAdmin', 'dev@localhost');
    return next();
  }
  if (!c.env.ACCESS_AUD || !c.env.ACCESS_TEAM_DOMAIN || c.env.ACCESS_TEAM_DOMAIN.startsWith('PREENCHER')) {
    throw new ErroHttp(503, 'Cloudflare Access não configurado');
  }
  const token = c.req.header('Cf-Access-Jwt-Assertion');
  const carga = token ? await validarJwtAccess(token, c.env) : null;
  if (!carga) throw new ErroHttp(403, 'Acesso não autorizado');
  c.set('emailAdmin', carga.email ?? '');
  await next();
});
