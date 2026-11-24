// Bindings e variáveis do Worker (wrangler.jsonc + segredos).
export interface Env {
  DB: D1Database;
  FOTOS: R2Bucket;
  ASSETS: Fetcher;
  /** Segredo HMAC do token de sessão (wrangler secret put SESSAO_SEGREDO). */
  SESSAO_SEGREDO: string;
  /** Segredo do Turnstile (wrangler secret put TURNSTILE_SECRET). */
  TURNSTILE_SECRET: string;
  TURNSTILE_SITE_KEY: string;
  /** Audience da aplicação do Cloudflare Access. */
  ACCESS_AUD: string;
  /** Ex.: "minha-equipe.cloudflareaccess.com" */
  ACCESS_TEAM_DOMAIN: string;
  /** Somente em desenvolvimento local ("1"): libera o admin sem Access. */
  ADMIN_DEV_LIVRE?: string;
}

export interface Variaveis {
  sessaoId: string;
  emailAdmin: string;
}

export type AppEnv = { Bindings: Env; Variables: Variaveis };
