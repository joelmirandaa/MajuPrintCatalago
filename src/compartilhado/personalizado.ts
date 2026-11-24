// Regras do item "Modelo personalizado": opção de modelo e tamanho personalizado em centímetros.

/** Escolha obrigatória da cliente: mandar uma imagem de referência ou usar só a própria foto. */
export const OPCOES_MODELO = ['referencia', 'apenas_foto'] as const;
export type OpcaoModelo = (typeof OPCOES_MODELO)[number];

export const ROTULO_OPCAO_MODELO: Record<OpcaoModelo, string> = {
  referencia: 'Enviar modelo de referência',
  apenas_foto: 'Apenas minha foto',
};

/** Nome gravado no item do pedido (painel, WhatsApp e carrinho). */
export const NOME_ITEM_PERSONALIZADO: Record<OpcaoModelo, string> = {
  referencia: 'Personalizado — com modelo de referência',
  apenas_foto: 'Personalizado — apenas a foto da cliente',
};

/** Limite de impressão por campo: folha A4 em pé, 21 cm de largura × 29,7 cm de altura. */
export const LIMITE_CM = { largura: 21, altura: 29.7 } as const;
export type Eixo = keyof typeof LIMITE_CM;

const numeroCm = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/** "15 × 20,5 cm" (largura × altura). */
export function formatarMedidas(larguraCm: number, alturaCm: number): string {
  return `${numeroCm(larguraCm)} × ${numeroCm(alturaCm)} cm`;
}

/** "21 × 29,7 cm" — texto do limite para mensagens. */
export const TEXTO_LIMITE = formatarMedidas(LIMITE_CM.largura, LIMITE_CM.altura);

/** Mensagem exibida quando uma medida passa do limite do seu campo. */
export function mensagemLimite(eixo: Eixo): string {
  return `Excede o limite permitido: a ${eixo} máxima é ${numeroCm(LIMITE_CM[eixo])} cm`;
}

/** Converte o texto digitado ("15", "12,5", "12.5") em número com até 1 casa; null se não for um número positivo. */
export function lerMedidaCm(texto: string): number | null {
  const limpo = texto.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(limpo)) return null;
  const valor = Math.round(Number(limpo) * 10) / 10;
  return valor > 0 ? valor : null;
}

/** Erro de uma medida digitada (vazia não é erro aqui), ou null se estiver dentro do limite. */
export function validarMedida(eixo: Eixo, texto: string): string | null {
  if (texto.trim() === '') return null;
  const valor = lerMedidaCm(texto);
  if (valor === null) return 'Use um número maior que zero';
  return valor > LIMITE_CM[eixo] ? mensagemLimite(eixo) : null;
}

/** "Tamanho personalizado: 15 × 20,5 cm" — gravado no pedido e exibido no carrinho. */
export function nomeTamanhoPersonalizado(larguraCm: number, alturaCm: number): string {
  return `Tamanho personalizado: ${formatarMedidas(larguraCm, alturaCm)}`;
}
