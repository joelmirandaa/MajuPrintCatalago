// Funções de acesso à API. Toda falha vira um ErroApi com mensagem amigável.
import type { EntradaPedido } from '../compartilhado/esquemas';
import type {
  CatalogoAdminResposta,
  CatalogoResposta,
  Categoria,
  ConfigCompleta,
  ListaPedidosResposta,
  Modelo,
  Papel,
  PedidoCompleto,
  PedidoCriadoResposta,
  Preco,
  SessaoResposta,
  StatusPedido,
  Tamanho,
  UploadResposta,
} from '../compartilhado/tipos';
import { obterTokenSessao, invalidarSessao } from './util/sessao';

export class ErroApi extends Error {
  constructor(
    mensagem: string,
    public readonly status: number,
    public readonly detalhes?: unknown,
  ) {
    super(mensagem);
  }
}

const MENSAGEM_REDE = 'Sem conexão com a internet. Confira sua rede e tente de novo.';

async function requisitar<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(caminho, {
      ...opcoes,
      headers: { ...(opcoes.body && typeof opcoes.body === 'string' ? { 'Content-Type': 'application/json' } : {}), ...opcoes.headers },
    });
  } catch {
    throw new ErroApi(MENSAGEM_REDE, 0);
  }
  const tipo = resposta.headers.get('Content-Type') ?? '';
  const corpo: unknown = tipo.includes('application/json') ? await resposta.json().catch(() => null) : null;
  if (!resposta.ok) {
    const dados = (corpo ?? {}) as { erro?: string; detalhes?: unknown };
    throw new ErroApi(dados.erro ?? 'Ops, algo deu errado. Tenta de novo?', resposta.status, dados.detalhes);
  }
  return corpo as T;
}

const json = (corpo: unknown) => JSON.stringify(corpo);

// ---------- Público ----------

export const buscarCatalogo = () => requisitar<CatalogoResposta>('/api/catalogo');

export const criarSessao = (turnstileToken: string, tokenAnterior?: string) =>
  requisitar<SessaoResposta>('/api/sessao', { method: 'POST', body: json({ turnstileToken, tokenAnterior }) });

/** Executa uma chamada autenticada; se a sessão expirou no servidor, renova uma vez e repete. */
async function comSessao<T>(executar: (token: string) => Promise<T>): Promise<T> {
  try {
    return await executar(await obterTokenSessao());
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 401) {
      invalidarSessao();
      return executar(await obterTokenSessao());
    }
    throw erro;
  }
}

export interface OpcoesUpload {
  arquivo: File;
  tipo: string;
  largura: number | null;
  altura: number | null;
  aoProgredir?: (fracao: number) => void;
  sinal?: AbortSignal;
}

function enviarComXhr(token: string, o: OpcoesUpload): Promise<UploadResposta> {
  return new Promise((resolver, rejeitar) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/uploads');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', o.tipo);
    xhr.setRequestHeader('X-Nome-Arquivo', encodeURIComponent(o.arquivo.name));
    if (o.largura) xhr.setRequestHeader('X-Largura', String(o.largura));
    if (o.altura) xhr.setRequestHeader('X-Altura', String(o.altura));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) o.aoProgredir?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      let corpo: { erro?: string; uploadId?: string } = {};
      try {
        corpo = JSON.parse(xhr.responseText) as typeof corpo;
      } catch {
        /* resposta sem JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && corpo.uploadId) resolver({ uploadId: corpo.uploadId });
      else rejeitar(new ErroApi(corpo.erro ?? 'Não foi possível enviar a foto. Tenta de novo?', xhr.status));
    };
    xhr.onerror = () => rejeitar(new ErroApi(MENSAGEM_REDE, 0));
    xhr.onabort = () => rejeitar(new ErroApi('Envio cancelado', -1));
    o.sinal?.addEventListener('abort', () => xhr.abort());
    xhr.send(o.arquivo);
  });
}

export const enviarFoto = (o: OpcoesUpload) => comSessao((token) => enviarComXhr(token, o));

export const removerFoto = (uploadId: string) =>
  comSessao((token) =>
    requisitar<{ ok: true }>(`/api/uploads/${encodeURIComponent(uploadId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
  );

export const criarPedido = (pedido: EntradaPedido) =>
  comSessao((token) =>
    requisitar<PedidoCriadoResposta>('/api/pedidos', {
      method: 'POST',
      body: json(pedido),
      headers: { Authorization: `Bearer ${token}` },
    }),
  );

// ---------- Admin ----------

export const admin = {
  pedidos: (status: StatusPedido | '', pagina: number) =>
    requisitar<ListaPedidosResposta>(`/api/admin/pedidos?status=${status}&pagina=${pagina}`),
  contagem: () => requisitar<Partial<Record<StatusPedido, number>>>('/api/admin/pedidos/contagem'),
  pedido: (codigo: string) => requisitar<PedidoCompleto>(`/api/admin/pedidos/${encodeURIComponent(codigo)}`),
  mudarStatus: (codigo: string, status: StatusPedido) =>
    requisitar<PedidoCompleto>(`/api/admin/pedidos/${encodeURIComponent(codigo)}`, {
      method: 'PATCH',
      body: json({ status }),
    }),
  urlFoto: (id: number, inline = false) => `/api/admin/fotos/${id}${inline ? '?inline=1' : ''}`,

  catalogo: () => requisitar<CatalogoAdminResposta>('/api/admin/catalogo'),

  salvarCategoria: (dados: Omit<Categoria, 'id'>, id?: number) =>
    requisitar<Categoria>(id ? `/api/admin/categorias/${id}` : '/api/admin/categorias', {
      method: id ? 'PUT' : 'POST',
      body: json(dados),
    }),
  apagarCategoria: (id: number) => requisitar(`/api/admin/categorias/${id}`, { method: 'DELETE' }),

  salvarModelo: (dados: Omit<Modelo, 'id' | 'imagemKey'>, id?: number) =>
    requisitar<Modelo>(id ? `/api/admin/modelos/${id}` : '/api/admin/modelos', {
      method: id ? 'PUT' : 'POST',
      body: json(dados),
    }),
  enviarImagemModelo: (id: number, imagem: Blob) =>
    requisitar<Modelo>(`/api/admin/modelos/${id}/imagem`, {
      method: 'PUT',
      body: imagem,
      headers: { 'Content-Type': 'image/webp' },
    }),
  ordenarModelos: (ids: number[]) =>
    requisitar('/api/admin/modelos/ordem', { method: 'PUT', body: json({ ids }) }),
  apagarModelo: (id: number) => requisitar(`/api/admin/modelos/${id}`, { method: 'DELETE' }),

  salvarTamanho: (dados: Omit<Tamanho, 'id'>, id?: number) =>
    requisitar<Tamanho>(id ? `/api/admin/tamanhos/${id}` : '/api/admin/tamanhos', {
      method: id ? 'PUT' : 'POST',
      body: json(dados),
    }),
  apagarTamanho: (id: number) => requisitar(`/api/admin/tamanhos/${id}`, { method: 'DELETE' }),

  salvarPapel: (dados: Omit<Papel, 'id'>, id?: number) =>
    requisitar<Papel>(id ? `/api/admin/papeis/${id}` : '/api/admin/papeis', {
      method: id ? 'PUT' : 'POST',
      body: json(dados),
    }),
  apagarPapel: (id: number) => requisitar(`/api/admin/papeis/${id}`, { method: 'DELETE' }),

  salvarPrecos: (precos: Preco[]) => requisitar('/api/admin/precos', { method: 'PUT', body: json({ precos }) }),

  config: () => requisitar<ConfigCompleta>('/api/admin/config'),
  salvarConfig: (dados: ConfigCompleta) =>
    requisitar<ConfigCompleta>('/api/admin/config', { method: 'PUT', body: json(dados) }),
};

export function urlImagemModelo(imagemKey: string | null): string | null {
  return imagemKey ? `/img/${imagemKey}` : null;
}
