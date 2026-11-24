// Tabelas Drizzle — espelham migrations/0001_inicial.sql.
import { sqliteTable, integer, text, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

const bool = (nome: string) => integer(nome, { mode: 'boolean' });

export const categorias = sqliteTable('categorias', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull(),
  ordem: integer('ordem').notNull().default(0),
  ativo: bool('ativo').notNull().default(true),
});

export const modelos = sqliteTable('modelos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoriaId: integer('categoria_id').references(() => categorias.id),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  imagemKey: text('imagem_key'),
  disponivel: bool('disponivel').notNull().default(true),
  ativo: bool('ativo').notNull().default(true),
  ordem: integer('ordem').notNull().default(0),
  criadoEm: integer('criado_em').notNull(),
});

export const tamanhos = sqliteTable('tamanhos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull(),
  larguraCm: real('largura_cm'),
  alturaCm: real('altura_cm'),
  ordem: integer('ordem').notNull().default(0),
  ativo: bool('ativo').notNull().default(true),
});

export const papeis = sqliteTable('papeis', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nome: text('nome').notNull(),
  ordem: integer('ordem').notNull().default(0),
  ativo: bool('ativo').notNull().default(true),
});

export const precos = sqliteTable(
  'precos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    modeloId: integer('modelo_id').references(() => modelos.id),
    tamanhoId: integer('tamanho_id').notNull().references(() => tamanhos.id),
    papelId: integer('papel_id').notNull().references(() => papeis.id),
    valorCentavos: integer('valor_centavos').notNull(),
  },
  (t) => [uniqueIndex('precos_unico').on(t.modeloId, t.tamanhoId, t.papelId)],
);

export const pedidos = sqliteTable(
  'pedidos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    codigo: text('codigo').notNull().unique(),
    nome: text('nome').notNull(),
    telefone: text('telefone').notNull(),
    endereco: text('endereco').notNull(),
    pagamento: text('pagamento', { enum: ['pix', 'cartao'] }).notNull(),
    observacao: text('observacao'),
    subtotalCentavos: integer('subtotal_centavos').notNull(),
    temPersonalizado: bool('tem_personalizado').notNull().default(false),
    status: text('status', { enum: ['novo', 'confirmado', 'producao', 'entregue', 'cancelado'] })
      .notNull()
      .default('novo'),
    criadoEm: integer('criado_em').notNull(),
    atualizadoEm: integer('atualizado_em').notNull(),
    entregueEm: integer('entregue_em'),
    apagarEm: integer('apagar_em'),
  },
  (t) => [index('idx_pedidos_status').on(t.status, t.criadoEm), index('idx_pedidos_apagar').on(t.apagarEm)],
);

export const itens = sqliteTable(
  'itens',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    pedidoId: integer('pedido_id')
      .notNull()
      .references(() => pedidos.id, { onDelete: 'cascade' }),
    tipo: text('tipo', { enum: ['catalogo', 'personalizado'] }).notNull(),
    modeloId: integer('modelo_id'),
    modeloNome: text('modelo_nome').notNull(),
    tamanhoNome: text('tamanho_nome').notNull(),
    papelNome: text('papel_nome').notNull(),
    quantidade: integer('quantidade').notNull(),
    precoUnitCentavos: integer('preco_unit_centavos'),
    subtotalCentavos: integer('subtotal_centavos'),
    descricao: text('descricao'),
  },
  (t) => [index('idx_itens_pedido').on(t.pedidoId)],
);

export const fotos = sqliteTable(
  'fotos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    itemId: integer('item_id')
      .notNull()
      .references(() => itens.id, { onDelete: 'cascade' }),
    r2Key: text('r2_key').notNull().unique(),
    funcao: text('funcao', { enum: ['cliente', 'referencia'] }).notNull(),
    nomeOriginal: text('nome_original'),
    tipoMime: text('tipo_mime'),
    bytes: integer('bytes'),
    largura: integer('largura'),
    altura: integer('altura'),
  },
  (t) => [index('idx_fotos_item').on(t.itemId)],
);

export const uploads = sqliteTable(
  'uploads',
  {
    id: text('id').primaryKey(),
    r2Key: text('r2_key').notNull().unique(),
    sessao: text('sessao').notNull(),
    nomeOriginal: text('nome_original'),
    tipoMime: text('tipo_mime'),
    bytes: integer('bytes'),
    largura: integer('largura'),
    altura: integer('altura'),
    criadoEm: integer('criado_em').notNull(),
  },
  (t) => [index('idx_uploads_criado').on(t.criadoEm)],
);

export const config = sqliteTable('config', {
  chave: text('chave').primaryKey(),
  valor: text('valor').notNull(),
});
