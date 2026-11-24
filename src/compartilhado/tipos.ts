// Tipos compartilhados entre o front-end e o Worker.

export type StatusPedido = 'novo' | 'confirmado' | 'producao' | 'entregue' | 'cancelado';
export type FormaPagamento = 'pix' | 'cartao';
export type TipoItem = 'catalogo' | 'personalizado';
export type FuncaoFoto = 'cliente' | 'referencia';

export interface Categoria {
  id: number;
  nome: string;
  ordem: number;
  ativo: boolean;
}

export interface Modelo {
  id: number;
  categoriaId: number | null;
  nome: string;
  descricao: string | null;
  imagemKey: string | null;
  disponivel: boolean;
  ativo: boolean;
  ordem: number;
}

export interface Tamanho {
  id: number;
  nome: string;
  larguraCm: number | null;
  alturaCm: number | null;
  ordem: number;
  ativo: boolean;
}

export interface Papel {
  id: number;
  nome: string;
  ordem: number;
  ativo: boolean;
}

/** Linha da tabela de preços. `modeloId = null` é o preço base, válido para todos os modelos. */
export interface Preco {
  modeloId: number | null;
  tamanhoId: number;
  papelId: number;
  valorCentavos: number;
}

export interface ConfigPublica {
  nomeLoja: string;
  textoBoasVindas: string;
  avisoQualidade: string;
}

export interface CatalogoResposta {
  categorias: Categoria[];
  modelos: Modelo[];
  tamanhos: Tamanho[];
  papeis: Papel[];
  precos: Preco[];
  config: ConfigPublica;
  turnstileSiteKey: string;
}

export interface SessaoResposta {
  token: string;
  expiraEm: number;
}

export interface UploadResposta {
  uploadId: string;
}

export interface PedidoCriadoResposta {
  codigo: string;
  linkWhatsapp: string;
}

export interface ErroResposta {
  erro: string;
  detalhes?: unknown;
}

// ---------- Admin ----------

export interface PedidoResumo {
  codigo: string;
  nome: string;
  status: StatusPedido;
  subtotalCentavos: number;
  temPersonalizado: boolean;
  criadoEm: number;
}

export interface ListaPedidosResposta {
  pedidos: PedidoResumo[];
  pagina: number;
  temMais: boolean;
}

export interface FotoPedido {
  id: number;
  itemId: number;
  funcao: FuncaoFoto;
  nomeOriginal: string | null;
  tipoMime: string | null;
  bytes: number | null;
  largura: number | null;
  altura: number | null;
}

export interface ItemPedido {
  id: number;
  tipo: TipoItem;
  modeloId: number | null;
  modeloNome: string;
  tamanhoNome: string;
  papelNome: string;
  quantidade: number;
  precoUnitCentavos: number | null;
  subtotalCentavos: number | null;
  descricao: string | null;
  fotos: FotoPedido[];
}

export interface PedidoCompleto {
  codigo: string;
  nome: string;
  telefone: string;
  endereco: string;
  pagamento: FormaPagamento;
  observacao: string | null;
  subtotalCentavos: number;
  temPersonalizado: boolean;
  status: StatusPedido;
  criadoEm: number;
  atualizadoEm: number;
  entregueEm: number | null;
  apagarEm: number | null;
  itens: ItemPedido[];
}

export interface ConfigCompleta {
  nome_loja: string;
  whatsapp_numero: string;
  texto_boas_vindas: string;
  aviso_qualidade: string;
}

export interface CatalogoAdminResposta {
  categorias: Categoria[];
  modelos: Modelo[];
  tamanhos: Tamanho[];
  papeis: Papel[];
  precos: Preco[];
}
