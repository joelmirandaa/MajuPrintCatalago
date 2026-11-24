// Telefone celular brasileiro: máscara, validação e normalização, usados pela loja, pelo painel e pela API.
// Formato padrão: (DD) 9XXXX-XXXX → gravado só com os 11 dígitos (DDD + número).

/** DDDs em uso no Brasil (Anatel). */
const DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38, 41, 42, 43, 44, 45, 46, 47,
  48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87,
  88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

export const DIGITOS_CELULAR = 11;
export const EXEMPLO_CELULAR = '(91) 99184-1888';

/**
 * Só os dígitos do DDD + número. Remove o código do país quando ele vier junto
 * (ex.: colado como "+55 91 99184-1888") e descarta o que passar de 11 dígitos.
 */
export function digitosCelular(valor: string): string {
  let d = valor.replace(/\D/g, '');
  if (d.length > DIGITOS_CELULAR && d.startsWith('55')) d = d.slice(2);
  return d.slice(0, DIGITOS_CELULAR);
}

/** Máscara progressiva enquanto a pessoa digita: "9" → "(9", "9199" → "(91) 99", … → "(91) 99184-1888". */
export function mascararCelular(valor: string): string {
  const d = digitosCelular(valor);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Mensagem de erro do celular, ou null se for válido. Recebe o valor com ou sem máscara. */
export function validarCelular(valor: string): string | null {
  const d = digitosCelular(valor);
  if (d.length === 0) return 'Informe o número de celular com DDD';
  if (d.length < 2) return 'Informe o DDD com 2 dígitos';
  if (!DDDS.has(Number(d.slice(0, 2)))) return 'DDD inválido';
  if (d.length < DIGITOS_CELULAR) return `Número incompleto. Use o formato ${EXEMPLO_CELULAR}`;
  if (d[2] !== '9') return 'O celular deve começar com 9 depois do DDD';
  return null;
}

/**
 * Formata um telefone já gravado para exibição. Aceita os formatos antigos
 * (10 dígitos, com ou sem 55) para que pedidos anteriores continuem legíveis.
 */
export function formatarTelefone(digitos: string): string {
  const d = digitos.startsWith('55') && digitos.length > 11 ? digitos.slice(2) : digitos;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digitos;
}
