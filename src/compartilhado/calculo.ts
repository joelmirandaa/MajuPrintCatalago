// Regra de preço única, usada no front (exibição) e no Worker (valor oficial do pedido).
import type { Preco } from './tipos';

export interface TabelaPrecos {
  precos: readonly Preco[];
}

/**
 * Preço unitário de um modelo em um tamanho × papel.
 * Um preço específico do modelo substitui o preço base. Sem preço → null (combinação indisponível).
 * Para itens personalizados, use `modeloId = null` apenas se quiser a estimativa base.
 */
export function precoUnitario(
  precos: readonly Preco[],
  modeloId: number | null,
  tamanhoId: number,
  papelId: number,
): number | null {
  let base: number | null = null;
  for (const p of precos) {
    if (p.tamanhoId !== tamanhoId || p.papelId !== papelId) continue;
    if (modeloId !== null && p.modeloId === modeloId) return p.valorCentavos;
    if (p.modeloId === null) base = p.valorCentavos;
  }
  return base;
}

/** Menor preço possível do modelo entre os tamanhos e papéis ativos ("a partir de"). */
export function precoAPartirDe(
  precos: readonly Preco[],
  modeloId: number,
  tamanhoIds: readonly number[],
  papelIds: readonly number[],
): number | null {
  let menor: number | null = null;
  for (const t of tamanhoIds) {
    for (const p of papelIds) {
      const v = precoUnitario(precos, modeloId, t, p);
      if (v !== null && (menor === null || v < menor)) menor = v;
    }
  }
  return menor;
}

export interface LinhaCalculo {
  tipo: 'catalogo' | 'personalizado';
  modeloId: number | null;
  /** null = tamanho personalizado (em cm), só existe em itens personalizados. */
  tamanhoId: number | null;
  papelId: number;
  quantidade: number;
}

export interface ResultadoLinha {
  precoUnitCentavos: number | null;
  subtotalCentavos: number | null;
}

/** Item personalizado é sempre "a orçar" (null). Item de catálogo sem preço também retorna null. */
export function calcularLinha(precos: readonly Preco[], linha: LinhaCalculo): ResultadoLinha {
  if (linha.tipo === 'personalizado' || linha.tamanhoId === null) return { precoUnitCentavos: null, subtotalCentavos: null };
  const unit = precoUnitario(precos, linha.modeloId, linha.tamanhoId, linha.papelId);
  if (unit === null) return { precoUnitCentavos: null, subtotalCentavos: null };
  return { precoUnitCentavos: unit, subtotalCentavos: unit * linha.quantidade };
}

export interface ResultadoTotal {
  linhas: ResultadoLinha[];
  subtotalCentavos: number;
  temAOrcar: boolean;
}

export function calcularTotal(precos: readonly Preco[], linhas: readonly LinhaCalculo[]): ResultadoTotal {
  const resultado = linhas.map((l) => calcularLinha(precos, l));
  let subtotal = 0;
  let temAOrcar = false;
  for (const r of resultado) {
    if (r.subtotalCentavos === null) temAOrcar = true;
    else subtotal += r.subtotalCentavos;
  }
  return { linhas: resultado, subtotalCentavos: subtotal, temAOrcar };
}
