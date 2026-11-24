import { describe, expect, it } from 'vitest';
import { calcularLinha, calcularTotal, precoAPartirDe, precoUnitario } from '../src/compartilhado/calculo';
import type { Preco } from '../src/compartilhado/tipos';

const precos: Preco[] = [
  { modeloId: null, tamanhoId: 1, papelId: 1, valorCentavos: 500 },
  { modeloId: null, tamanhoId: 1, papelId: 2, valorCentavos: 600 },
  { modeloId: null, tamanhoId: 2, papelId: 1, valorCentavos: 1000 },
  { modeloId: 7, tamanhoId: 1, papelId: 1, valorCentavos: 700 },
];

describe('precoUnitario', () => {
  it('usa o preço base quando não há preço do modelo', () => {
    expect(precoUnitario(precos, 3, 1, 2)).toBe(600);
  });
  it('preço específico do modelo substitui o base, independentemente da ordem', () => {
    expect(precoUnitario(precos, 7, 1, 1)).toBe(700);
    expect(precoUnitario([...precos].reverse(), 7, 1, 1)).toBe(700);
  });
  it('retorna null para combinação sem preço', () => {
    expect(precoUnitario(precos, 3, 2, 2)).toBeNull();
  });
});

describe('precoAPartirDe', () => {
  it('retorna o menor preço entre tamanhos e papéis ativos', () => {
    expect(precoAPartirDe(precos, 3, [1, 2], [1, 2])).toBe(500);
    expect(precoAPartirDe(precos, 7, [1, 2], [1, 2])).toBe(600);
    expect(precoAPartirDe(precos, 3, [2], [2])).toBeNull();
  });
});

describe('calcularTotal', () => {
  it('soma itens com preço e marca personalizados como a orçar', () => {
    const r = calcularTotal(precos, [
      { tipo: 'catalogo', modeloId: 3, tamanhoId: 1, papelId: 1, quantidade: 5 },
      { tipo: 'catalogo', modeloId: 7, tamanhoId: 1, papelId: 1, quantidade: 2 },
      { tipo: 'personalizado', modeloId: null, tamanhoId: 2, papelId: 1, quantidade: 1 },
    ]);
    expect(r.subtotalCentavos).toBe(2500 + 1400);
    expect(r.temAOrcar).toBe(true);
    expect(r.linhas[2]).toEqual({ precoUnitCentavos: null, subtotalCentavos: null });
  });
  it('linha de catálogo sem preço fica nula', () => {
    expect(calcularLinha(precos, { tipo: 'catalogo', modeloId: 1, tamanhoId: 2, papelId: 2, quantidade: 1 }).subtotalCentavos).toBeNull();
  });
});
