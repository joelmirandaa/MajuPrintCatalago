# Estrutura do Projeto — Catálogo Web de Fotos

> Documento de referência para a equipe e para o agente de IA que vai desenvolver o projeto.
> **Agente: leia este arquivo inteiro antes de escrever qualquer código e siga as regras da seção 12.**

---

## 1. Visão geral

Catálogo web, usado principalmente no **celular**, acessado pelo link do **Instagram**.

Fluxo da cliente:

1. Abre o link no Instagram → o site a leva para o **navegador externo** (Chrome/Safari).
2. Navega pelo catálogo de modelos.
3. Escolhe um modelo, **envia a foto dela**, escolhe **tamanho**, **papel** e **quantidade**.
4. Ou usa a aba **Personalizado**: envia a foto dela + a foto de um modelo que não está no site.
5. Os itens vão para o **carrinho**, que mostra valores e **subtotal**.
6. Em **Finalizar**, preenche nome, WhatsApp, endereço e **forma de pagamento** (Pix ou Cartão).
7. Toca em **Salvar e enviar** → o pedido é salvo e o **WhatsApp abre com a mensagem pronta**, contendo o **link do pedido no painel**.

Fluxo da equipe:

1. Recebe a mensagem no WhatsApp e toca no link do pedido.
2. Faz login no painel (Cloudflare Access) e vê o pedido com as fotos **em qualidade original** para baixar.
3. Combina entrega e **gera o link de pagamento manualmente** (fora do site).
4. Atualiza o status do pedido. Ao marcar **Entregue**, fotos e dados da cliente são **apagados 1 dia depois**.

**Fora do escopo (não implementar):**
- Pagamento no site (sem checkout, sem Pix gerado, sem integração com gateway). O site só **registra a forma de pagamento escolhida**.
- Pré-visualização da foto aplicada no modelo.
- Cadastro/login de clientes.

---

## 2. Requisito principal: caber no plano GRATUITO do Cloudflare

Todo o projeto deve rodar **sem custo** (apenas o domínio, se usado, é pago à parte).

| Recurso | Limite gratuito relevante | Como respeitar |
|---|---|---|
| Workers (API) | 100.000 requisições/dia · **10 ms de CPU** por requisição · 128 MB de memória · 50 subrequisições | Nada de processamento pesado no servidor (sem redimensionar imagem, sem gerar zip). Isso é feito no navegador. |
| Arquivos estáticos | Grátis e ilimitados · até 20.000 arquivos · 25 MiB por arquivo | O site (React) é servido como arquivo estático. |
| D1 (banco) | 5 milhões de linhas lidas/dia · 100.000 gravadas/dia · 500 MB por banco · 50 consultas por requisição | Usar índices, `batch()` e consultas enxutas. |
| R2 (fotos) | 10 GB armazenados · 1 milhão de escritas e 10 milhões de leituras/mês · download grátis | Limpeza automática (seção 8). Limite de 25 MB por foto. |
| Corpo da requisição | 100 MB | Upload de uma foto por requisição. |
| Cron Triggers | Disponível no plano gratuito | Uma tarefa de hora em hora para limpeza. |
| Cloudflare Access | Grátis até 50 usuários | Protege `/admin` e `/api/admin`. |
| Turnstile | Grátis | Anti-robô no início do envio de fotos e pedidos. |

**Nunca** ativar recursos pagos (Workers Paid, Cloudflare Images, Queues pagas, etc.).

---

## 3. Tecnologias (stack)

| Camada | Tecnologia | Observação |
|---|---|---|
| Linguagem | **TypeScript** (estrito) | Em todo o projeto. |
| Front-end | **React 18 + Vite** | SPA, servida como arquivos estáticos do Worker. |
| Rotas do front | **React Router** | |
| Estilo | **Tailwind CSS** | Mobile-first. Cores tiradas da logo. |
| Estado do carrinho | **Zustand** com persistência em `localStorage` | O carrinho não se perde ao recarregar. |
| Back-end | **Hono** em Cloudflare Workers | Mesmo Worker serve a API e os arquivos estáticos. |
| Banco | **Cloudflare D1** (SQLite) + **Drizzle ORM** | Migrações em SQL na pasta `migrations/`. |
| Validação | **Zod** | Validar toda entrada da API. |
| Armazenamento de fotos | **Cloudflare R2** | Fotos originais, sem compressão. |
| Autenticação admin | **Cloudflare Access** | Login por código no e-mail. O Worker valida o JWT. |
| Anti-robô | **Cloudflare Turnstile** | |
| Zip no navegador | **fflate** (ou JSZip) | Para "Baixar todas" no painel. |
| Deploy | **Wrangler** + Workers Builds (Git) | `git push` → deploy automático. |

---

## 4. Estrutura de pastas

```
catalogo/
├─ wrangler.jsonc               # Configuração do Worker: assets, D1, R2, cron, variáveis
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ tailwind.config.ts
├─ drizzle.config.ts
├─ estrutura.md                 # Este documento
├─ migrations/
│  └─ 0001_inicial.sql          # Criação das tabelas
├─ public/
│  ├─ logo.svg                  # Logo da marca
│  └─ favicon.png
└─ src/
   ├─ worker/                   # ===== SERVIDOR (Hono) =====
   │  ├─ index.ts               # App Hono, monta rotas, exporta fetch + scheduled
   │  ├─ env.ts                 # Tipos dos bindings (DB, FOTOS, variáveis)
   │  ├─ db/
   │  │  ├─ schema.ts           # Tabelas Drizzle
   │  │  └─ client.ts
   │  ├─ rotas/
   │  │  ├─ publico.ts          # Catálogo, preços, sessão (Turnstile), upload, criar pedido
   │  │  ├─ admin.ts            # Pedidos, modelos, categorias, preços, config, download
   │  │  └─ imagens.ts          # Serve imagens do catálogo (com cache)
   │  ├─ middlewares/
   │  │  ├─ access.ts           # Valida JWT do Cloudflare Access
   │  │  └─ sessao.ts           # Valida token de sessão (pós-Turnstile)
   │  ├─ servicos/
   │  │  ├─ precos.ts           # Cálculo de preço (mesma regra do front)
   │  │  ├─ whatsapp.ts         # Monta a mensagem e o link wa.me
   │  │  └─ limpeza.ts          # Lógica do cron
   │  └─ utils/
   │     ├─ ids.ts              # Geração de IDs e chaves aleatórias
   │     └─ dinheiro.ts         # Centavos ⇄ "R$ 0,00"
   ├─ compartilhado/            # ===== CÓDIGO USADO PELOS DOIS LADOS =====
   │  ├─ tipos.ts               # Tipos de Modelo, Item, Pedido...
   │  ├─ esquemas.ts            # Esquemas Zod
   │  └─ calculo.ts             # Função pura de cálculo de preço
   └─ app/                      # ===== FRONT-END (React) =====
      ├─ main.tsx
      ├─ App.tsx                # Rotas
      ├─ api.ts                 # Funções fetch para a API
      ├─ loja/
      │  └─ carrinho.ts         # Store Zustand do carrinho
      ├─ paginas/
      │  ├─ Catalogo.tsx        # /
      │  ├─ Modelo.tsx          # /modelo/:id
      │  ├─ Personalizado.tsx   # /personalizado
      │  ├─ Finalizar.tsx       # /finalizar
      │  ├─ Enviado.tsx         # /enviado
      │  └─ SairInstagram.tsx   # Tela de saída do navegador do Instagram
      ├─ admin/
      │  ├─ LayoutAdmin.tsx
      │  ├─ Pedidos.tsx         # /admin
      │  ├─ Pedido.tsx          # /admin/pedidos/:codigo
      │  ├─ Modelos.tsx         # /admin/modelos
      │  ├─ Precos.tsx          # /admin/precos
      │  └─ Config.tsx          # /admin/config
      └─ componentes/
         ├─ Topo.tsx            # Logo + ícone do carrinho
         ├─ CardModelo.tsx
         ├─ Carrinho.tsx        # Lateral (desktop) / gaveta (celular)
         ├─ BarraCarrinho.tsx   # Barra fixa inferior no celular
         ├─ UploadFoto.tsx      # Upload com progresso + aviso de qualidade
         ├─ SeletorOpcoes.tsx   # Tamanho / papel / quantidade
         └─ AvisoQualidade.tsx
```

---

## 5. Banco de dados (D1)

Regras gerais:
- Valores em dinheiro sempre em **centavos (INTEGER)**.
- Datas em **INTEGER** (Unix timestamp em milissegundos).
- O item do pedido guarda **cópia** do nome do modelo, tamanho, papel e preço (o pedido não muda se o catálogo for editado).

```sql
-- migrations/0001_inicial.sql

CREATE TABLE categorias (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nome      TEXT    NOT NULL,
  ordem     INTEGER NOT NULL DEFAULT 0,
  ativo     INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE modelos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  categoria_id   INTEGER REFERENCES categorias(id),
  nome           TEXT    NOT NULL,
  descricao      TEXT,
  imagem_key     TEXT,                       -- chave no R2 (catalogo/...)
  disponivel     INTEGER NOT NULL DEFAULT 1, -- 0 = esgotado (aparece, mas não adiciona)
  ativo          INTEGER NOT NULL DEFAULT 1, -- 0 = oculto do catálogo
  ordem          INTEGER NOT NULL DEFAULT 0,
  criado_em      INTEGER NOT NULL
);

CREATE TABLE tamanhos (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  nome    TEXT    NOT NULL,                  -- ex.: "10×15"
  largura_cm REAL,                           -- usado no aviso de qualidade
  altura_cm  REAL,
  ordem   INTEGER NOT NULL DEFAULT 0,
  ativo   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE papeis (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  nome    TEXT    NOT NULL,                  -- "Fotográfico", "Adesivo", "Comum"
  ordem   INTEGER NOT NULL DEFAULT 0,
  ativo   INTEGER NOT NULL DEFAULT 1
);

-- Preço base por tamanho × papel. modelo_id NULL = vale para todos os modelos.
-- Se existir linha com modelo_id preenchido, ela substitui o preço base para aquele modelo.
CREATE TABLE precos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  modelo_id       INTEGER REFERENCES modelos(id),
  tamanho_id      INTEGER NOT NULL REFERENCES tamanhos(id),
  papel_id        INTEGER NOT NULL REFERENCES papeis(id),
  valor_centavos  INTEGER NOT NULL,
  UNIQUE (modelo_id, tamanho_id, papel_id)
);

CREATE TABLE pedidos (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo             TEXT    NOT NULL UNIQUE, -- ex.: "A7K2-9QX" (curto, legível)
  nome               TEXT    NOT NULL,
  telefone           TEXT    NOT NULL,
  endereco           TEXT    NOT NULL,
  pagamento          TEXT    NOT NULL CHECK (pagamento IN ('pix','cartao')),
  observacao         TEXT,
  subtotal_centavos  INTEGER NOT NULL,        -- soma dos itens com preço (personalizado = a orçar)
  tem_personalizado  INTEGER NOT NULL DEFAULT 0,
  status             TEXT    NOT NULL DEFAULT 'novo'
                     CHECK (status IN ('novo','confirmado','producao','entregue','cancelado')),
  criado_em          INTEGER NOT NULL,
  atualizado_em      INTEGER NOT NULL,
  entregue_em        INTEGER,
  apagar_em          INTEGER                  -- preenchido ao marcar entregue/cancelado
);
CREATE INDEX idx_pedidos_status ON pedidos(status, criado_em);
CREATE INDEX idx_pedidos_apagar ON pedidos(apagar_em);

CREATE TABLE itens (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id            INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tipo                 TEXT    NOT NULL CHECK (tipo IN ('catalogo','personalizado')),
  modelo_id            INTEGER,               -- NULL se personalizado
  modelo_nome          TEXT    NOT NULL,      -- cópia ("Personalizado" se for o caso)
  tamanho_nome         TEXT    NOT NULL,
  papel_nome           TEXT    NOT NULL,
  quantidade           INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unit_centavos  INTEGER,               -- NULL = a orçar
  subtotal_centavos    INTEGER,               -- NULL = a orçar
  descricao            TEXT                   -- texto livre do personalizado
);
CREATE INDEX idx_itens_pedido ON itens(pedido_id);

CREATE TABLE fotos (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id        INTEGER NOT NULL REFERENCES itens(id) ON DELETE CASCADE,
  r2_key         TEXT    NOT NULL UNIQUE,
  funcao         TEXT    NOT NULL CHECK (funcao IN ('cliente','referencia')),
  nome_original  TEXT,
  tipo_mime      TEXT,
  bytes          INTEGER,
  largura        INTEGER,
  altura         INTEGER
);
CREATE INDEX idx_fotos_item ON fotos(item_id);

-- Fotos enviadas que ainda não foram vinculadas a um pedido.
CREATE TABLE uploads (
  id          TEXT    PRIMARY KEY,            -- ID aleatório retornado ao front
  r2_key      TEXT    NOT NULL UNIQUE,
  sessao      TEXT    NOT NULL,               -- só a mesma sessão pode usar este upload
  nome_original TEXT,
  tipo_mime   TEXT,
  bytes       INTEGER,
  largura     INTEGER,
  altura      INTEGER,
  criado_em   INTEGER NOT NULL
);
CREATE INDEX idx_uploads_criado ON uploads(criado_em);

CREATE TABLE config (
  chave  TEXT PRIMARY KEY,
  valor  TEXT NOT NULL
);
-- Chaves esperadas: whatsapp_numero, aviso_qualidade, texto_boas_vindas, nome_loja
```

---

## 6. Armazenamento de fotos (R2)

Um bucket: **`fotos`**. Prefixos:

| Prefixo | Conteúdo | Quem acessa |
|---|---|---|
| `catalogo/<id-aleatorio>.webp` | Imagens dos modelos (já comprimidas no navegador do admin, ~200 KB) | Público, via `/img/:key` com cache |
| `pedidos/<id-aleatorio>/<nome>` | Fotos das clientes, **arquivo original sem alteração** | Somente admin |

Regras:
- Chaves sempre com ID aleatório (ex.: `crypto.randomUUID()`), nunca previsíveis.
- O bucket **não** é público. Fotos de clientes só saem pela rota admin (protegida).
- Tipos aceitos para cliente: `image/jpeg`, `image/png`, `image/heic`, `image/heif`, `image/webp`. Máximo **25 MB** por foto.
- O upload grava o corpo da requisição direto no R2 em streaming (`env.FOTOS.put(key, c.req.raw.body)`), sem carregar o arquivo inteiro na memória e sem processar a imagem.

---

## 7. API (Hono)

Todas as respostas em JSON. Entradas validadas com Zod.

### 7.1 Públicas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/catalogo` | Categorias ativas + modelos ativos (com `disponivel`) + tamanhos + papéis + tabela de preços + config pública. **Uma chamada só** para montar o site. Pode usar cache de 60 s. |
| POST | `/api/sessao` | Recebe token do Turnstile, valida e devolve um **token de sessão assinado (HMAC)** válido por 2 h. |
| POST | `/api/uploads` | Requer token de sessão. Recebe **uma** foto (corpo binário + cabeçalhos com nome, tipo, largura, altura). Salva no R2 em `pedidos/...`, grava em `uploads` e retorna `{ uploadId }`. |
| DELETE | `/api/uploads/:id` | Requer a mesma sessão. Remove uma foto que a cliente desistiu de usar. |
| POST | `/api/pedidos` | Requer token de sessão. Recebe dados da cliente + itens (com `uploadId`s). **Recalcula os preços no servidor**, cria pedido, itens e fotos, move os registros de `uploads` para `fotos` e retorna `{ codigo, linkWhatsapp }`. |
| GET | `/img/:key` | Serve imagem do catálogo (`catalogo/*` apenas) com `Cache-Control: public, max-age=31536000, immutable`. |

### 7.2 Admin (protegidas pelo Cloudflare Access + middleware `access.ts`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/admin/pedidos?status=` | Lista paginada. |
| GET | `/api/admin/pedidos/:codigo` | Pedido completo com itens e fotos. |
| PATCH | `/api/admin/pedidos/:codigo` | Muda status. Ao virar `entregue` ou `cancelado`: `apagar_em = agora + 24 h`. Se voltar para outro status: `apagar_em = NULL`. |
| GET | `/api/admin/fotos/:id` | Baixa a foto **original** (`Content-Disposition: attachment; filename="<codigo>_<item>_<nome>"`). |
| CRUD | `/api/admin/categorias` | |
| CRUD | `/api/admin/modelos` | Inclui upload da imagem do modelo (já em WebP, comprimida no navegador). |
| CRUD | `/api/admin/tamanhos`, `/api/admin/papeis` | |
| PUT | `/api/admin/precos` | Salva a tabela de preços inteira de uma vez (`batch`). |
| GET/PUT | `/api/admin/config` | |

---

## 8. Limpeza automática (Cron)

`wrangler.jsonc` → `"triggers": { "crons": ["0 * * * *"] }` (de hora em hora).

A cada execução (`servicos/limpeza.ts`):

1. **Pedidos vencidos:** `apagar_em <= agora` → apaga as fotos no R2 e depois o pedido no D1 (itens e fotos saem em cascata).
2. **Uploads abandonados:** registros em `uploads` com mais de **24 h** → apaga no R2 e no D1.
3. **Pedidos esquecidos:** status `novo` há mais de **15 dias** → apaga como no item 1.

Processar em lotes (ex.: 20 pedidos por execução) para não estourar o limite de subrequisições/CPU do plano gratuito. Usar `env.FOTOS.delete([...keys])` (aceita várias chaves).

---

## 9. Mensagem do WhatsApp

Montada no servidor (`servicos/whatsapp.ts`) e devolvida ao front, que abre o link com `window.location.href`.

Link: `https://wa.me/<whatsapp_numero>?text=<mensagem codificada com encodeURIComponent>`

Modelo da mensagem:

```
*Novo pedido #A7K2-9QX*

*Cliente:* Maria Silva
*WhatsApp:* (91) 9xxxx-xxxx
*Endereço:* Rua tal, 123 – Bairro – Belém

*Itens:*
1) Polaroid — 10×15 — Fotográfico — 5 un. — R$ 25,00
2) Personalizado — 20×30 — Adesivo — 1 un. — a orçar
   Obs.: quero igual ao modelo enviado, com fundo rosa

*Subtotal:* R$ 25,00 (+ itens a orçar)
*Pagamento:* Pix

Ver pedido e fotos: https://SEU-DOMINIO/admin/pedidos/A7K2-9QX
```

---

## 10. Telas

### 10.1 Cliente (mobile-first)

- **Topo:** logo à esquerda; ícone do carrinho com contador à direita.
- **Catálogo `/`:** abas/chips de categoria no topo (rolagem horizontal) e grade de 2 colunas com `CardModelo` (foto, nome, "a partir de R$ X", selo "Esgotado" quando `disponivel = 0`). Card fixo "Quero um modelo personalizado" levando a `/personalizado`.
- **Modelo `/modelo/:id`:** foto grande, descrição, `SeletorOpcoes` (tamanho, papel, quantidade +/−), `UploadFoto` e preço calculado ao vivo. Botão **Adicionar ao carrinho**, desabilitado até a foto terminar de subir.
- **Personalizado `/personalizado`:** upload da foto da cliente, upload da foto do modelo de referência, tamanho, papel, quantidade e campo de observação. Preço: **"a orçar"** (ver pendências).
- **Carrinho:**
  - Celular: `BarraCarrinho` fixa embaixo ("3 itens · R$ 45,00 · Ver carrinho") → abre `Carrinho` como gaveta lateral.
  - Desktop (≥ 1024 px): `Carrinho` fixo na coluna lateral direita.
  - Conteúdo: miniatura da foto (URL local do navegador), nome, tamanho/papel, quantidade +/−, valor do item, remover, **Subtotal** e botão **Finalizar**.
- **Finalizar `/finalizar`:** nome, WhatsApp (com máscara), endereço, forma de pagamento (Pix / Cartão, botões grandes), observação. Botão **Salvar e enviar pelo WhatsApp**.
- **Enviado `/enviado`:** confirmação + botão "Abrir WhatsApp novamente" (caso não tenha aberto). Limpa o carrinho.

### 10.2 Aviso de qualidade (`AvisoQualidade`)

- Texto fixo (editável no admin): enviar foto em boa qualidade, de preferência HD, como arquivo original.
- No navegador, ler largura/altura da imagem (quando possível). Se a resolução for menor que ~150 DPI para o tamanho escolhido (`largura_cm`/`altura_cm`), mostrar alerta amarelo: *"Essa foto pode ficar sem nitidez no tamanho 20×30."* Não bloquear o envio.

### 10.3 Saída do Instagram (`SairInstagram`)

Ao carregar o app, detectar navegador interno (`navigator.userAgent` contém `Instagram`, `FBAN` ou `FBAV`):

- **Android:** redirecionar automaticamente para
  `intent://<host><caminho>#Intent;scheme=https;package=com.android.chrome;end`
  (com link de reserva caso o Chrome não exista).
- **iPhone:** não há forma garantida de forçar o Safari. Mostrar tela cheia com a logo, uma seta apontando para o menu **⋯** e o texto *"Toque em ⋯ e depois em Abrir no navegador"*. Incluir botão que tenta `x-safari-https://<host><caminho>` (funciona em algumas versões do iOS).
- A cliente **não** acessa o catálogo enquanto estiver no navegador do Instagram.

### 10.4 Admin

- **Pedidos `/admin`:** abas por status (Novos, Confirmados, Em produção, Entregues), cartões com código, nome, data e subtotal.
- **Pedido `/admin/pedidos/:codigo`:** dados da cliente (telefone com botão para abrir o WhatsApp dela), itens, fotos em grade com **Baixar original** em cada uma e **Baixar todas** (.zip gerado no navegador com fflate), seletor de status. Ao marcar Entregue, mostrar: *"As fotos e os dados serão apagados em 24 h."*
- **Modelos `/admin/modelos`:** lista ordenável; formulário com foto (comprimida para WebP ~1600 px no navegador antes de enviar), nome, descrição, categoria, disponível, ativo.
- **Preços `/admin/precos`:** tabela editável tamanho × papel; opção de preço específico por modelo; cadastro de tamanhos e papéis.
- **Config `/admin/config`:** número do WhatsApp, textos de aviso, nome da loja.

### 10.5 Identidade visual

- Cores, fonte e estilo extraídos da **logo** (`public/logo.svg`). Definir as cores como tokens no `tailwind.config.ts` (`primaria`, `secundaria`, `fundo`, `texto`).
- Visual limpo, cantos arredondados, botões grandes (mínimo 44 px de altura), poucos campos por tela.
- Fonte legível no celular (16 px mínimo nos campos, para o iPhone não dar zoom).

---

## 11. Segurança

- `/admin/*` e `/api/admin/*` protegidos por uma aplicação no **Cloudflare Access** (política: e-mails da equipe).
- O Worker **também** valida o cabeçalho `Cf-Access-Jwt-Assertion` (assinatura + `aud`) no middleware `access.ts`. Nunca confiar só na configuração do painel.
- **Recalcular preços no servidor** ao criar o pedido; ignorar valores enviados pelo front.
- Limitar: 25 MB por foto, 20 fotos por pedido, 30 itens por pedido, textos com tamanho máximo.
- Token de sessão (pós-Turnstile) assinado com segredo `SESSAO_SEGREDO` (`wrangler secret put`).
- Segredos nunca no código nem no Git: `SESSAO_SEGREDO`, `TURNSTILE_SECRET`, `ACCESS_AUD`, `ACCESS_TEAM_DOMAIN`.

---

## 12. Instruções para o agente de IA

### 12.1 Regras obrigatórias

1. **Respeitar o plano gratuito** (seção 2). Antes de adicionar qualquer recurso do Cloudflare, confirmar que é gratuito.
2. **Nada pesado no Worker:** sem redimensionar imagens, sem gerar zip, sem loops grandes. Isso vai para o navegador.
3. **Não implementar pagamento** de nenhum tipo.
4. **Não implementar pré-visualização** da foto no modelo.
5. **TypeScript estrito**; sem `any` sem justificativa.
6. **Código, nomes de variáveis, comentários e textos da interface em português do Brasil.**
7. Dinheiro sempre em **centavos**; formatar só na exibição com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
8. A função de cálculo de preço fica em `src/compartilhado/calculo.ts` e é **a mesma** no front e no servidor.
9. Toda entrada da API validada com **Zod** (`src/compartilhado/esquemas.ts`).
10. Mudanças no banco **somente** via nova migração em `migrations/` (nunca editar uma migração já aplicada).
11. **Mobile-first:** testar cada tela em 375 px de largura antes de considerar pronta.
12. Não adicionar bibliotecas sem necessidade. Preferir as listadas na seção 3.
13. Não apagar nem reescrever este arquivo; se uma decisão mudar, atualizar a seção correspondente e registrar na seção 15.

### 12.2 Ordem de desenvolvimento (fases)

**Fase 1 — Base e catálogo**
- [x] Criar projeto (Vite + React + TS + Tailwind + Hono + Wrangler) no formato "Worker com assets".
- [x] Configurar `wrangler.jsonc` com D1 (`DB`), R2 (`FOTOS`), assets e cron.
- [x] Migração `0001_inicial.sql` + dados de exemplo (seed) para desenvolvimento.
- [x] `GET /api/catalogo`.
- [x] Telas: Topo, Catálogo, Modelo (sem upload ainda), Carrinho (gaveta + barra + lateral desktop).
- [x] Store do carrinho com persistência.
- [x] Tela de saída do Instagram.
- ✅ *Pronto quando:* dá para navegar, escolher opções, ver preço e montar o carrinho no celular.

**Fase 2 — Fotos e pedido**
- [x] Turnstile + `POST /api/sessao`.
- [x] `UploadFoto` com barra de progresso, `POST/DELETE /api/uploads`.
- [x] Aviso de qualidade.
- [x] Tela Personalizado.
- [x] Tela Finalizar + `POST /api/pedidos` + abertura do WhatsApp + tela Enviado.
- ✅ *Pronto quando:* um pedido completo chega no WhatsApp com o link correto e as fotos estão no R2.

**Fase 3 — Painel admin**
- [ ] Configurar Cloudflare Access (painel — pendente) + [x] middleware de validação do JWT.
- [x] Pedidos (lista, detalhe, download original, baixar todas, status).
- [x] Modelos, categorias, tamanhos, papéis, preços, config.
- ✅ *Pronto quando:* a equipe gerencia todo o catálogo e os pedidos sem mexer em código.

**Fase 4 — Limpeza e acabamento**
- [x] Cron de limpeza (seção 8) + teste local (`/cdn-cgi/handler/scheduled` no `npm run dev`).
- [x] Revisão visual com as cores da logo.
- [ ] Teste completo no Android e no iPhone, saindo do Instagram.
- [ ] Deploy de produção.

### 12.3 Comandos úteis

```bash
npm create cloudflare@latest catalogo     # criar projeto (escolher framework React + Workers)
npm i hono drizzle-orm zod zustand react-router-dom fflate
npm i -D drizzle-kit tailwindcss @cloudflare/workers-types

npx wrangler d1 create catalogo-db
npx wrangler r2 bucket create fotos

npx wrangler d1 migrations apply catalogo-db --local    # banco local
npx wrangler d1 migrations apply catalogo-db --remote   # banco de produção

npx wrangler secret put SESSAO_SEGREDO
npx wrangler secret put TURNSTILE_SECRET

npm run dev                       # desenvolvimento local
npx wrangler deploy               # publicar
```

### 12.4 Exemplo de `wrangler.jsonc`

```jsonc
{
  "name": "catalogo",
  "main": "src/worker/index.ts",
  "compatibility_date": "2026-11-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": "./dist/client",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*", "/img/*"]
  },
  "d1_databases": [
    { "binding": "DB", "database_name": "catalogo-db", "database_id": "PREENCHER" }
  ],
  "r2_buckets": [
    { "binding": "FOTOS", "bucket_name": "fotos" }
  ],
  "triggers": { "crons": ["0 * * * *"] },
  "vars": {
    "ACCESS_TEAM_DOMAIN": "PREENCHER.cloudflareaccess.com",
    "TURNSTILE_SITE_KEY": "PREENCHER"
  }
}
```

---

## 13. Configuração no painel do Cloudflare (feita pela equipe)

1. Criar conta gratuita em dash.cloudflare.com.
2. Conectar o repositório do GitHub em **Workers & Pages → Create → Import a repository**.
3. Criar o widget do **Turnstile** e copiar a site key / secret.
4. Em **Zero Trust → Access → Applications**, criar uma aplicação *Self-hosted* para `SEU-DOMINIO/admin` e `SEU-DOMINIO/api/admin`, com política permitindo os e-mails da equipe. Copiar o **AUD**.
5. (Opcional) Adicionar domínio próprio em **Custom domains** do Worker.

---

## 14. Pendências (definir antes da Fase 1)

- [ ] **Logo** em SVG ou PNG de alta resolução → `public/logo.svg`.
- [ ] **Regra de preço:** só tamanho × papel, ou preço diferente por modelo? Há desconto por quantidade? (A tabela `precos` já suporta preço por modelo; desconto por quantidade exigiria nova tabela.)
- [ ] **Personalizado:** fica "a orçar" ou usa a tabela base de tamanho × papel como estimativa?
- [ ] Lista inicial de **categorias, tamanhos e papéis**.
- [ ] **Número do WhatsApp** que recebe os pedidos.
- [ ] Domínio próprio ou endereço `.workers.dev`.

---

## 15. Registro de decisões

| Data | Decisão |
|---|---|
| 23/11/2026 | Hospedagem 100% no plano gratuito do Cloudflare (Workers + D1 + R2 + Access). |
| 23/11/2026 | Sem pré-visualização da foto no modelo. |
| 23/11/2026 | Pagamento manual pelo WhatsApp; o site só registra Pix ou Cartão. |
| 23/11/2026 | Mensagem do WhatsApp leva o link do pedido no painel; fotos baixadas em qualidade original pelo painel. |
| 23/11/2026 | Fotos e dados apagados 24 h após marcar como Entregue. |
| 23/11/2026 | Abrir sempre no navegador externo, nunca no navegador do Instagram. |
| 23/11/2026 | Projeto criado na raiz do repositório (em vez de uma pasta `catalogo/`). |
| 23/11/2026 | React 18 + Tailwind 3 (para manter `tailwind.config.ts`) + `@cloudflare/vite-plugin` para rodar o Worker no `vite dev`. |
| 23/11/2026 | Item personalizado fica **"a orçar"** (não usa a tabela base como estimativa) até a definição da pendência da seção 14. |
| 23/11/2026 | O token de sessão renovado mantém o mesmo ID por até 24 h, para as fotos do carrinho continuarem válidas após 2 h. |
| 23/11/2026 | `ADMIN_DEV_LIVRE=1` libera o admin só em `localhost` (desenvolvimento); produção exige o JWT do Access. |
| 23/11/2026 | Criação do pedido em duas fases (pedido+itens, depois fotos via `INSERT ... SELECT`) para caber no limite de consultas por requisição do D1 gratuito. |
