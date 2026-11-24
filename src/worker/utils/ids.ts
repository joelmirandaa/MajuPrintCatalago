// IDs e chaves aleatórias (nunca previsíveis).

// Sem caracteres ambíguos (0/O, 1/I/L) para o código do pedido ser fácil de ler e ditar.
const ALFABETO_CODIGO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function caracteresAleatorios(alfabeto: string, tamanho: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(tamanho));
  let saida = '';
  for (const b of bytes) saida += alfabeto[b % alfabeto.length];
  return saida;
}

/** Código curto e legível do pedido, ex.: "A7K2-9QX". */
export function gerarCodigoPedido(): string {
  return `${caracteresAleatorios(ALFABETO_CODIGO, 4)}-${caracteresAleatorios(ALFABETO_CODIGO, 3)}`;
}

/** ID aleatório seguro para URLs (base64url, 128 bits). */
export function gerarIdAleatorio(): string {
  return paraBase64Url(crypto.getRandomValues(new Uint8Array(16)));
}

export function paraBase64Url(bytes: Uint8Array): string {
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function deBase64Url(texto: string): Uint8Array {
  const normal = texto.replace(/-/g, '+').replace(/_/g, '/');
  const binario = atob(normal + '='.repeat((4 - (normal.length % 4)) % 4));
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

/** Nome de arquivo seguro para chave do R2 e Content-Disposition. */
export function sanitizarNomeArquivo(nome: string): string {
  const semAcento = nome.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const limpo = semAcento.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/_+/g, '_').replace(/^[._]+/, '');
  return (limpo || 'foto').slice(0, 100);
}
