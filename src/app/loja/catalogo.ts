// Catálogo carregado uma única vez (GET /api/catalogo) e compartilhado entre as telas.
import { create } from 'zustand';
import type { CatalogoResposta, Preco } from '../../compartilhado/tipos';
import { buscarCatalogo } from '../api';

interface EstadoCatalogo {
  dados: CatalogoResposta | null;
  estado: 'ocioso' | 'carregando' | 'erro' | 'pronto';
  erro: string | null;
  carregar: (forcar?: boolean) => Promise<void>;
}

const SEM_PRECOS: readonly Preco[] = [];

/** Seletor estável (Zustand v5 exige a mesma referência entre renders para não entrar em loop). */
export const selecionarPrecos = (s: EstadoCatalogo): readonly Preco[] => s.dados?.precos ?? SEM_PRECOS;

export const useCatalogo = create<EstadoCatalogo>((set, get) => ({
  dados: null,
  estado: 'ocioso',
  erro: null,
  carregar: async (forcar = false) => {
    const { estado } = get();
    if (estado === 'carregando' || (estado === 'pronto' && !forcar)) return;
    set({ estado: 'carregando', erro: null });
    try {
      set({ dados: await buscarCatalogo(), estado: 'pronto' });
    } catch (e) {
      set({ estado: 'erro', erro: e instanceof Error ? e.message : 'Erro ao carregar o catálogo' });
    }
  },
}));
