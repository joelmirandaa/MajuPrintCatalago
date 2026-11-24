const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Converte centavos (inteiro) em "R$ 0,00". */
export function formatarCentavos(centavos: number): string {
  return formatador.format(centavos / 100);
}

/** Converte um texto digitado ("12,50", "R$ 1.234,5") em centavos. Retorna null se inválido. */
export function textoParaCentavos(texto: string): number | null {
  const limpo = texto.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  if (limpo === '' || limpo === '-') return null;
  const valor = Number(limpo);
  if (!Number.isFinite(valor) || valor < 0) return null;
  return Math.round(valor * 100);
}
