// Store do carrinho (Zustand) com persistência em localStorage.
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calcularTotal, type LinhaCalculo } from '../../compartilhado/calculo';
import type { EntradaItemPedido } from '../../compartilhado/esquemas';
import { nomeTamanhoPersonalizado, type OpcaoModelo } from '../../compartilhado/personalizado';
import type { Preco, Tamanho } from '../../compartilhado/tipos';

/** Fotos não vinculadas a pedido são apagadas pelo servidor após 24 h; avisamos antes disso. */
export const VALIDADE_FOTO_MS = 23 * 60 * 60 * 1000;

export interface FotoEnviada {
  uploadId: string;
  nome: string;
  largura: number | null;
  altura: number | null;
  miniatura: string | null;
  enviadaEm: number;
}

export interface ItemCarrinho {
  idLocal: string;
  tipo: 'catalogo' | 'personalizado';
  modeloId: number | null;
  modeloNome: string;
  /** null quando a cliente informou um tamanho personalizado (ver `medidas`). */
  tamanhoId: number | null;
  medidas?: { larguraCm: number; alturaCm: number };
  /** Só em itens personalizados. Itens salvos antes dessa opção existir são deduzidos pela referência. */
  opcaoModelo?: OpcaoModelo;
  papelId: number;
  quantidade: number;
  foto: FotoEnviada;
  fotoReferencia?: FotoEnviada;
  descricao?: string;
  /** Marcado quando o servidor informa que a foto não existe mais. */
  fotoExpirada?: boolean;
}

interface EstadoCarrinho {
  itens: ItemCarrinho[];
  gavetaAberta: boolean;
  adicionar: (item: Omit<ItemCarrinho, 'idLocal'>) => void;
  remover: (idLocal: string) => ItemCarrinho | undefined;
  alterarQuantidade: (idLocal: string, quantidade: number) => void;
  marcarFotosExpiradas: (uploadIds: string[]) => void;
  limpar: () => void;
  abrirGaveta: () => void;
  fecharGaveta: () => void;
}

export const useCarrinho = create<EstadoCarrinho>()(
  persist(
    (set, get) => ({
      itens: [],
      gavetaAberta: false,
      adicionar: (item) =>
        set((s) => ({ itens: [...s.itens, { ...item, idLocal: crypto.randomUUID() }] })),
      remover: (idLocal) => {
        const item = get().itens.find((i) => i.idLocal === idLocal);
        set((s) => ({ itens: s.itens.filter((i) => i.idLocal !== idLocal) }));
        return item;
      },
      alterarQuantidade: (idLocal, quantidade) =>
        set((s) => ({
          itens: s.itens.map((i) =>
            i.idLocal === idLocal ? { ...i, quantidade: Math.min(999, Math.max(1, quantidade)) } : i,
          ),
        })),
      marcarFotosExpiradas: (uploadIds) =>
        set((s) => ({
          itens: s.itens.map((i) =>
            uploadIds.includes(i.foto.uploadId) ||
            (i.fotoReferencia && uploadIds.includes(i.fotoReferencia.uploadId))
              ? { ...i, fotoExpirada: true }
              : i,
          ),
        })),
      limpar: () => set({ itens: [], gavetaAberta: false }),
      abrirGaveta: () => set({ gavetaAberta: true }),
      fecharGaveta: () => set({ gavetaAberta: false }),
    }),
    {
      name: 'majuprint-carrinho',
      version: 1,
      partialize: (s) => ({ itens: s.itens }),
    },
  ),
);

export function fotoVencida(item: ItemCarrinho, agora = Date.now()): boolean {
  if (item.fotoExpirada) return true;
  const maisAntiga = Math.min(item.foto.enviadaEm, item.fotoReferencia?.enviadaEm ?? Infinity);
  return agora - maisAntiga > VALIDADE_FOTO_MS;
}

export function paraLinhaCalculo(item: ItemCarrinho): LinhaCalculo {
  return {
    tipo: item.tipo,
    modeloId: item.modeloId,
    tamanhoId: item.tamanhoId,
    papelId: item.papelId,
    quantidade: item.quantidade,
  };
}

export function totalCarrinho(itens: ItemCarrinho[], precos: readonly Preco[]) {
  return calcularTotal(precos, itens.map(paraLinhaCalculo));
}

export function paraItemPedido(item: ItemCarrinho): EntradaItemPedido {
  if (item.tipo === 'catalogo') {
    return {
      tipo: 'catalogo',
      modeloId: item.modeloId ?? 0,
      tamanhoId: item.tamanhoId ?? 0,
      papelId: item.papelId,
      quantidade: item.quantidade,
      uploadId: item.foto.uploadId,
    };
  }
  return {
    tipo: 'personalizado',
    opcaoModelo: item.opcaoModelo ?? (item.fotoReferencia ? 'referencia' : 'apenas_foto'),
    ...(item.tamanhoId !== null
      ? { tamanhoId: item.tamanhoId }
      : { larguraCm: item.medidas?.larguraCm, alturaCm: item.medidas?.alturaCm }),
    papelId: item.papelId,
    quantidade: item.quantidade,
    uploadIdCliente: item.foto.uploadId,
    uploadIdReferencia: item.fotoReferencia?.uploadId,
    descricao: item.descricao,
  };
}

/** Nome do tamanho para exibir no carrinho e no resumo (predefinido ou personalizado em cm). */
export function nomeTamanhoItem(item: ItemCarrinho, tamanhos: readonly Tamanho[] | undefined): string {
  if (item.medidas) return nomeTamanhoPersonalizado(item.medidas.larguraCm, item.medidas.alturaCm);
  return tamanhos?.find((t) => t.id === item.tamanhoId)?.nome ?? '—';
}
