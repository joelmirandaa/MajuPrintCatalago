import { describe, expect, it } from 'vitest';
import { esquemaItemPedido, uploadsDoItem } from '../src/compartilhado/esquemas';
import {
  NOME_ITEM_PERSONALIZADO,
  formatarMedidas,
  lerMedidaCm,
  nomeTamanhoPersonalizado,
  validarMedida,
} from '../src/compartilhado/personalizado';

describe('medidas', () => {
  it('lê inteiros e decimais com vírgula ou ponto', () => {
    expect(lerMedidaCm('15')).toBe(15);
    expect(lerMedidaCm('12,5')).toBe(12.5);
    expect(lerMedidaCm(' 7.25 ')).toBe(7.3);
    for (const v of ['', '0', '0,0', '-3', 'abc', '1e2', '12,5cm']) expect(lerMedidaCm(v)).toBeNull();
  });
  it('limite por campo: largura até 21 cm, altura até 29,7 cm', () => {
    expect(validarMedida('largura', '21')).toBeNull();
    expect(validarMedida('largura', '21,1')).toMatch(/largura máxima é 21 cm/);
    expect(validarMedida('altura', '29,7')).toBeNull();
    expect(validarMedida('altura', '29,8')).toMatch(/altura máxima é 29,7 cm/);
    expect(validarMedida('altura', '25')).toBeNull();
    expect(validarMedida('largura', '25')).toMatch(/Excede o limite/);
    expect(validarMedida('largura', '')).toBeNull();
    expect(validarMedida('largura', '0')).toMatch(/maior que zero/);
  });
  it('formata em pt-BR, largura × altura', () => {
    expect(formatarMedidas(15, 20.5)).toBe('15 × 20,5 cm');
    expect(nomeTamanhoPersonalizado(10, 10)).toBe('Tamanho personalizado: 10 × 10 cm');
  });
});

describe('esquemaItemPersonalizado', () => {
  const base = { tipo: 'personalizado', papelId: 1, quantidade: 1, uploadIdCliente: 'a'.repeat(22) };
  const comRef = { ...base, opcaoModelo: 'referencia', uploadIdReferencia: 'b'.repeat(22) };
  const soFoto = { ...base, opcaoModelo: 'apenas_foto' };
  const valido = (item: object) => esquemaItemPedido.safeParse(item).success;

  it('exige escolher a opção de modelo', () => {
    expect(valido({ ...base, tamanhoId: 1, uploadIdReferencia: 'b'.repeat(22) })).toBe(false);
    expect(valido({ ...base, tamanhoId: 1, opcaoModelo: 'catalogo' })).toBe(false);
  });
  it('"Enviar modelo de referência" exige a imagem; "Apenas minha foto" não aceita referência', () => {
    expect(valido({ ...comRef, tamanhoId: 1 })).toBe(true);
    expect(valido({ ...comRef, uploadIdReferencia: undefined, tamanhoId: 1 })).toBe(false);
    expect(valido({ ...soFoto, tamanhoId: 1 })).toBe(true);
    expect(valido({ ...soFoto, tamanhoId: 1, uploadIdReferencia: 'b'.repeat(22) })).toBe(false);
    expect(uploadsDoItem(esquemaItemPedido.parse({ ...soFoto, tamanhoId: 1 }))).toEqual(['a'.repeat(22)]);
  });
  it('tamanho personalizado: positivo, largura ≤ 21 e altura ≤ 29,7', () => {
    expect(valido({ ...soFoto, larguraCm: 21, alturaCm: 29.7 })).toBe(true);
    expect(valido({ ...soFoto, larguraCm: 29.7, alturaCm: 21 })).toBe(false);
    expect(valido({ ...soFoto, larguraCm: 21.1, alturaCm: 10 })).toBe(false);
    expect(valido({ ...soFoto, larguraCm: 10, alturaCm: 29.8 })).toBe(false);
    expect(valido({ ...soFoto, larguraCm: 0, alturaCm: 10 })).toBe(false);
    expect(valido({ ...soFoto, larguraCm: -5, alturaCm: 10 })).toBe(false);
    expect(valido({ ...soFoto, larguraCm: '15', alturaCm: '20' })).toBe(false);
    expect(valido({ ...soFoto, larguraCm: 15 })).toBe(false);
  });
  it('tamanho predefinido e medidas ao mesmo tempo, ou nenhum dos dois, é recusado', () => {
    expect(valido({ ...soFoto, tamanhoId: 1, larguraCm: 15, alturaCm: 20 })).toBe(false);
    expect(valido({ ...soFoto })).toBe(false);
  });
  it('nome do item registra a opção escolhida', () => {
    expect(NOME_ITEM_PERSONALIZADO.referencia).toMatch(/modelo de referência/);
    expect(NOME_ITEM_PERSONALIZADO.apenas_foto).toMatch(/apenas a foto/);
  });
});
