-- Migração inicial (estrutura.md, seção 5)

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
  imagem_key     TEXT,
  disponivel     INTEGER NOT NULL DEFAULT 1,
  ativo          INTEGER NOT NULL DEFAULT 1,
  ordem          INTEGER NOT NULL DEFAULT 0,
  criado_em      INTEGER NOT NULL
);

CREATE TABLE tamanhos (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  nome       TEXT    NOT NULL,
  largura_cm REAL,
  altura_cm  REAL,
  ordem      INTEGER NOT NULL DEFAULT 0,
  ativo      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE papeis (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  nome    TEXT    NOT NULL,
  ordem   INTEGER NOT NULL DEFAULT 0,
  ativo   INTEGER NOT NULL DEFAULT 1
);

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
  codigo             TEXT    NOT NULL UNIQUE,
  nome               TEXT    NOT NULL,
  telefone           TEXT    NOT NULL,
  endereco           TEXT    NOT NULL,
  pagamento          TEXT    NOT NULL CHECK (pagamento IN ('pix','cartao')),
  observacao         TEXT,
  subtotal_centavos  INTEGER NOT NULL,
  tem_personalizado  INTEGER NOT NULL DEFAULT 0,
  status             TEXT    NOT NULL DEFAULT 'novo'
                     CHECK (status IN ('novo','confirmado','producao','entregue','cancelado')),
  criado_em          INTEGER NOT NULL,
  atualizado_em      INTEGER NOT NULL,
  entregue_em        INTEGER,
  apagar_em          INTEGER
);
CREATE INDEX idx_pedidos_status ON pedidos(status, criado_em);
CREATE INDEX idx_pedidos_apagar ON pedidos(apagar_em);

CREATE TABLE itens (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id            INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tipo                 TEXT    NOT NULL CHECK (tipo IN ('catalogo','personalizado')),
  modelo_id            INTEGER,
  modelo_nome          TEXT    NOT NULL,
  tamanho_nome         TEXT    NOT NULL,
  papel_nome           TEXT    NOT NULL,
  quantidade           INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unit_centavos  INTEGER,
  subtotal_centavos    INTEGER,
  descricao            TEXT
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

CREATE TABLE uploads (
  id            TEXT    PRIMARY KEY,
  r2_key        TEXT    NOT NULL UNIQUE,
  sessao        TEXT    NOT NULL,
  nome_original TEXT,
  tipo_mime     TEXT,
  bytes         INTEGER,
  largura       INTEGER,
  altura        INTEGER,
  criado_em     INTEGER NOT NULL
);
CREATE INDEX idx_uploads_criado ON uploads(criado_em);

CREATE TABLE config (
  chave  TEXT PRIMARY KEY,
  valor  TEXT NOT NULL
);

-- Configuração padrão (editável no painel em /admin/config)
INSERT INTO config (chave, valor) VALUES
  ('nome_loja', 'Maju Print'),
  ('whatsapp_numero', ''),
  ('texto_boas_vindas', 'Escolha seu modelo, envie sua foto e a gente imprime com carinho.'),
  ('aviso_qualidade', 'Envie sua foto em boa qualidade, de preferência em HD e como arquivo original (sem print de tela).');
