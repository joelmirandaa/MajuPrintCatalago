// Verificação de resolução da foto para o tamanho de impressão (estrutura.md, seção 10.2).

export const DPI_MINIMO = 150;

/**
 * Retorna true se a foto tem resolução suficiente (~150 DPI) para o tamanho.
 * Considera a melhor orientação (a foto pode ser girada na impressão).
 * Sem dados suficientes → true (não alerta).
 */
export function resolucaoSuficiente(
  larguraPx: number | null | undefined,
  alturaPx: number | null | undefined,
  larguraCm: number | null | undefined,
  alturaCm: number | null | undefined,
): boolean {
  if (!larguraPx || !alturaPx || !larguraCm || !alturaCm) return true;
  const pxMaior = Math.max(larguraPx, alturaPx);
  const pxMenor = Math.min(larguraPx, alturaPx);
  const cmMaior = Math.max(larguraCm, alturaCm);
  const cmMenor = Math.min(larguraCm, alturaCm);
  const dpiMaior = pxMaior / (cmMaior / 2.54);
  const dpiMenor = pxMenor / (cmMenor / 2.54);
  return Math.min(dpiMaior, dpiMenor) >= DPI_MINIMO;
}
