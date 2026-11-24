import { describe, expect, it } from 'vitest';
import { esquemaCliente, esquemaConfig } from '../src/compartilhado/esquemas';
import { digitosCelular, formatarTelefone, mascararCelular, validarCelular } from '../src/compartilhado/telefone';

describe('mascararCelular', () => {
  it('aplica (DD) 9XXXX-XXXX progressivamente', () => {
    const esperado = ['(9', '(91', '(91) 9', '(91) 99', '(91) 991', '(91) 9918', '(91) 99184', '(91) 99184-1', '(91) 99184-18', '(91) 99184-188', '(91) 99184-1888'];
    const digitos = '91991841888';
    esperado.forEach((m, i) => expect(mascararCelular(digitos.slice(0, i + 1))).toBe(m));
  });
  it('aceita só números e limita a 11 dígitos', () => {
    expect(mascararCelular('9a1b9c9184-1888')).toBe('(91) 99184-1888');
    expect(mascararCelular('919918418889999')).toBe('(91) 99184-1888');
    expect(mascararCelular('abc')).toBe('');
  });
  it('remove o +55 de um número colado', () => {
    expect(mascararCelular('+55 (91) 99184-1888')).toBe('(91) 99184-1888');
    expect(digitosCelular('5591991841888')).toBe('91991841888');
  });
  it('apagar o último dígito antes do hífen não trava a máscara', () => {
    expect(mascararCelular('(91) 99184-')).toBe('(91) 99184');
    expect(mascararCelular('(91) ')).toBe('(91');
  });
});

describe('validarCelular', () => {
  it('aceita celular brasileiro completo', () => {
    expect(validarCelular('(91) 99184-1888')).toBeNull();
    expect(validarCelular('11987654321')).toBeNull();
  });
  it('recusa vazio, incompleto, DDD inválido e número sem o 9', () => {
    expect(validarCelular('')).toMatch(/Informe/);
    expect(validarCelular('(91) 9918')).toMatch(/incompleto/);
    expect(validarCelular('(10) 99184-1888')).toBe('DDD inválido');
    expect(validarCelular('(20) 99184-1888')).toBe('DDD inválido');
    expect(validarCelular('(91) 3318-41888')).toMatch(/começar com 9/);
    expect(validarCelular('(91) 9918-4188')).toMatch(/incompleto/); // fixo/antigo com 10 dígitos
  });
});

describe('formatarTelefone (exibição de dados já gravados)', () => {
  it('formata 11 dígitos e mantém compatíveis os formatos antigos', () => {
    expect(formatarTelefone('91991841888')).toBe('(91) 99184-1888');
    expect(formatarTelefone('5591991841888')).toBe('(91) 99184-1888');
    expect(formatarTelefone('9133334444')).toBe('(91) 3333-4444');
    expect(formatarTelefone('123')).toBe('123');
  });
});

describe('esquemas com telefone', () => {
  const cliente = { nome: 'Maria', endereco: 'Rua A, 1', pagamento: 'pix' };
  it('cliente: grava só os 11 dígitos', () => {
    expect(esquemaCliente.parse({ ...cliente, telefone: '(91) 99184-1888' }).telefone).toBe('91991841888');
    expect(esquemaCliente.parse({ ...cliente, telefone: '+55 91 99184-1888' }).telefone).toBe('91991841888');
  });
  it('cliente: recusa número inválido ou com dígitos demais', () => {
    for (const telefone of ['', '(91) 9918', '(91) 3333-4444', '(00) 99184-1888', '(91) 99184-18889']) {
      expect(esquemaCliente.safeParse({ ...cliente, telefone }).success).toBe(false);
    }
  });
  const config = { nome_loja: 'Maju', texto_boas_vindas: '', aviso_qualidade: '' };
  it('config: aceita vazio ou celular e grava com 55', () => {
    expect(esquemaConfig.parse({ ...config, whatsapp_numero: '' }).whatsapp_numero).toBe('');
    expect(esquemaConfig.parse({ ...config, whatsapp_numero: '(91) 99184-1888' }).whatsapp_numero).toBe('5591991841888');
    expect(esquemaConfig.parse({ ...config, whatsapp_numero: '5591991841888' }).whatsapp_numero).toBe('5591991841888');
    expect(esquemaConfig.safeParse({ ...config, whatsapp_numero: '559133334444' }).success).toBe(false);
  });
});
