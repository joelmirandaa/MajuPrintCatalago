# Maju Print — Catálogo

Catálogo web (mobile-first) em que a cliente escolhe um modelo, envia a foto, monta o carrinho e envia o pedido pelo WhatsApp. A equipe gerencia pedidos e catálogo em `/admin`.

Roda 100% no plano gratuito do Cloudflare: **Workers + D1 + R2 + Access + Turnstile**.
Documentação: [`estrutura.md`](estrutura.md) (arquitetura), [`GuiaDesign.md`](GuiaDesign.md) (identidade visual), [`Commit.md`](Commit.md) (commits).

## Stack

React 18 + Vite + React Router + Tailwind · Zustand · Hono (Worker) · D1 + Drizzle · R2 · Zod · fflate · Phosphor Icons · TypeScript estrito.

## Rodar localmente

```bash
npm install
cp .dev.vars.example .dev.vars        # troque SESSAO_SEGREDO por um valor aleatório
npm run db:migrar:local               # cria as tabelas no D1 local
npm run db:seed:local                 # dados de EXEMPLO (opcional)
npm run dev                           # http://localhost:5173
```

- O `.dev.vars.example` usa as chaves **de teste** do Turnstile (sempre aprovam).
- `ADMIN_DEV_LIVRE=1` libera `/admin` **somente** quando acessado por `localhost`. Em produção o painel exige o Cloudflare Access.

## Testes

```bash
npm run typecheck                     # TypeScript (front, worker e testes)
npm test                              # testes unitários (Vitest)
node scripts/teste-fluxo.mjs http://localhost:5173   # fluxo completo da API (com npm run dev rodando)
```

Limpeza agendada (cron) em desenvolvimento: `curl http://localhost:5173/cdn-cgi/handler/scheduled`.

## Deploy (primeira vez)

```bash
npx wrangler d1 create catalogo-db    # copie o database_id para o wrangler.jsonc
npx wrangler r2 bucket create fotos
npm run db:migrar:remoto
npx wrangler secret put SESSAO_SEGREDO
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put ACCESS_AUD
npm run deploy
```

Antes do deploy, preencha em `wrangler.jsonc`: `database_id`, `ACCESS_TEAM_DOMAIN` e `TURNSTILE_SITE_KEY` (real). Configure o Cloudflare Access para `/admin*` e `/api/admin*` (seção 13 do `estrutura.md`). Depois, cadastre categorias, tamanhos, papéis, preços, modelos e o número do WhatsApp em `/admin`.

## Organização

```
migrations/          SQL do D1 (nunca editar uma migração já aplicada)
scripts/             seed de exemplo e teste de fluxo
src/compartilhado/   tipos, esquemas Zod e cálculo de preço (front + worker)
src/worker/          API Hono, middlewares (sessão, Access), serviços (pedidos, WhatsApp, limpeza)
src/app/             React: páginas da cliente, painel admin, componentes e stores
testes/              testes unitários
assets/marca/        arquivos originais da logo e da mascote
```
